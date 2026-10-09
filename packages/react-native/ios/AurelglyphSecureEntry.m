#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>
#import <React/RCTSurfacePresenterStub.h>
#import <UIKit/UIKit.h>

static UITextField<RCTBackedTextInputViewProtocol> *AurelglyphTextField(UIView *view)
{
  if ([view isKindOfClass:UITextField.class] && [view conformsToProtocol:@protocol(RCTBackedTextInputViewProtocol)]) {
    return (UITextField<RCTBackedTextInputViewProtocol> *)view;
  }
  for (UIView *child in view.subviews) {
    UITextField<RCTBackedTextInputViewProtocol> *field = AurelglyphTextField(child);
    if (field) return field;
  }
  return nil;
}

static BOOL AurelglyphPrepareField(UITextField<RCTBackedTextInputViewProtocol> *field, NSString *expectedValue, NSDictionary *selection)
{
    if (!field.window || !field.isFirstResponder || !field.isSecureTextEntry || !field.isEnabled ||
        field.markedTextRange ||
        ![field.attributedText.string isEqualToString:expectedValue]) return NO;
    NSString *value = [field.attributedText.string copy];
    UITextRange *entireValue = [field textRangeFromPosition:field.beginningOfDocument toPosition:field.endOfDocument];
    if (!entireValue) return NO;
    UITextRange *current = field.selectedTextRange;
    NSInteger start = current ? [field offsetFromPosition:field.beginningOfDocument toPosition:current.start] : value.length;
    NSInteger end = current ? [field offsetFromPosition:field.beginningOfDocument toPosition:current.end] : start;
    if (selection) {
      start = [selection[@"start"] integerValue];
      end = selection[@"end"] ? [selection[@"end"] integerValue] : start;
    }
    start = MAX(0, MIN(start, (NSInteger)value.length));
    end = MAX(start, MIN(end, (NSInteger)value.length));

    id<UITextFieldDelegate> delegate = field.delegate;
    id<RCTBackedTextInputDelegate> textDelegate = field.textInputDelegate;
    NSUndoManager *undo = field.undoManager;
    BOOL restoreUndo = undo.isUndoRegistrationEnabled;
    if (restoreUndo) [undo disableUndoRegistration];
    // Repair is not a user edit: keep RN's value/event count and callbacks intact.
    field.delegate = nil;
    field.textInputDelegate = nil;
    @try {
      [field replaceRange:entireValue withText:@""];
      field.clearsOnInsertion = NO;
      if (value.length) [field insertText:value];
      field.clearsOnInsertion = NO;
      UITextPosition *startPosition = [field positionFromPosition:field.beginningOfDocument offset:start];
      UITextPosition *endPosition = [field positionFromPosition:field.beginningOfDocument offset:end];
      if (startPosition && endPosition) {
        [field setSelectedTextRange:[field textRangeFromPosition:startPosition toPosition:endPosition] notifyDelegate:NO];
      }
    } @finally {
      field.textInputDelegate = textDelegate;
      field.delegate = delegate;
      if (restoreUndo && !undo.isUndoRegistrationEnabled) [undo enableUndoRegistration];
      else if (!restoreUndo && undo.isUndoRegistrationEnabled) [undo disableUndoRegistration];
    }
    return YES;
}

@interface AurelglyphSecureRequest : NSObject
@property (nonatomic, weak) UITextField<RCTBackedTextInputViewProtocol> *field;
@property (nonatomic, copy) NSString *value;
@property (nonatomic) NSUInteger remainingFrames;
@end
@implementation AurelglyphSecureRequest
@end

@interface AurelglyphSecureEntry : NSObject <RCTBridgeModule, RCTSurfacePresenterObserver, RCTInvalidating>
@property (nonatomic, weak) id<RCTSurfacePresenterStub> surfacePresenter;
@property (atomic) BOOL invalidated;
- (void)preparePendingInputs;
@end

// CADisplayLink must not retain the bridge module through its target.
@interface AurelglyphSecureTick : NSObject
@property (nonatomic, weak) AurelglyphSecureEntry *owner;
- (void)tick:(CADisplayLink *)link;
@end
@implementation AurelglyphSecureTick
- (void)tick:(__unused CADisplayLink *)link { [self.owner preparePendingInputs]; }
@end

@implementation AurelglyphSecureEntry {
  NSMutableSet<NSNumber *> *_registeredTags;
  NSMapTable<NSNumber *, UITextField<RCTBackedTextInputViewProtocol> *> *_ownedInputs;
  NSMutableDictionary<NSNumber *, AurelglyphSecureRequest *> *_pendingInputs;
  NSHashTable<UITextField *> *_repairingInputs;
  CADisplayLink *_pendingDisplayLink;
}

@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;
@synthesize surfacePresenter = _surfacePresenter;
RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup { return NO; }

- (instancetype)init
{
  if ((self = [super init])) {
    _registeredTags = [NSMutableSet new];
    _ownedInputs = [NSMapTable strongToWeakObjectsMapTable];
    _pendingInputs = [NSMutableDictionary new];
    _repairingInputs = [NSHashTable weakObjectsHashTable];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(inputDidBeginEditing:)
      name:UITextFieldTextDidBeginEditingNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(inputDidEndEditing:)
      name:UITextFieldTextDidEndEditingNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(inputDidChange:)
      name:UITextFieldTextDidChangeNotification object:nil];
  }
  return self;
}

- (void)dealloc
{
  [_pendingDisplayLink invalidate];
  [_surfacePresenter removeObserver:self];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)invalidate
{
  @synchronized (self) {
    if (self.invalidated) return;
    self.invalidated = YES;
  }
  // RN can invalidate on its module queue. Stop queued work immediately,
  // then tear down UIKit observers and main-owned collections on main.
  dispatch_block_t teardown = ^{
    [self->_pendingDisplayLink invalidate];
    self->_pendingDisplayLink = nil;
    [self->_surfacePresenter removeObserver:self];
    self->_surfacePresenter = nil;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [self->_pendingInputs removeAllObjects];
    [self->_repairingInputs removeAllObjects];
    [self->_ownedInputs removeAllObjects];
    [self->_registeredTags removeAllObjects];
  };
  if (NSThread.isMainThread) teardown();
  else dispatch_async(dispatch_get_main_queue(), teardown);
}

- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)presenter
{
  @synchronized (self) {
    if (self.invalidated || _surfacePresenter == presenter) return;
    [_surfacePresenter removeObserver:self];
    _surfacePresenter = presenter;
    [presenter addObserver:self];
  }
}

- (BOOL)prepareField:(UITextField<RCTBackedTextInputViewProtocol> *)field value:(NSString *)value selection:(NSDictionary *)selection
{
  if (self.invalidated) return NO;
  [_repairingInputs addObject:field];
  @try { return AurelglyphPrepareField(field, value, selection); }
  @finally { [_repairingInputs removeObject:field]; }
}

- (void)stopPendingClockIfIdle
{
  if (_pendingInputs.count) return;
  [_pendingDisplayLink invalidate];
  _pendingDisplayLink = nil;
}

- (void)cancelPendingForField:(UITextField *)field
{
  for (NSNumber *tag in [_pendingInputs.allKeys copy]) {
    if (_pendingInputs[tag].field == field) [_pendingInputs removeObjectForKey:tag];
  }
  [self stopPendingClockIfIdle];
}

- (void)inputDidEndEditing:(NSNotification *)notification
{
  if (self.invalidated) return;
  [self cancelPendingForField:notification.object];
}

- (void)inputDidChange:(NSNotification *)notification
{
  if (self.invalidated) return;
  if (![_repairingInputs containsObject:notification.object]) [self cancelPendingForField:notification.object];
}

- (void)attemptPendingTag:(NSNumber *)tag
{
  if (self.invalidated) return;
  AurelglyphSecureRequest *request = _pendingInputs[tag];
  if (!request) return;
  UITextField<RCTBackedTextInputViewProtocol> *field = AurelglyphTextField([self.viewRegistry_DEPRECATED viewForReactTag:tag]);
  if (![_registeredTags containsObject:tag] || field != request.field ||
      !field.window || !field.isFirstResponder || !field.isEnabled || field.markedTextRange) {
    [_pendingInputs removeObjectForKey:tag];
    return;
  }
  // Prop/state commits apply the caller-owned native selection themselves.
  // Snapshot that current range here, never replay a queued cached range.
  if ([self prepareField:field value:request.value selection:nil]) [_pendingInputs removeObjectForKey:tag];
}

- (void)didMountComponentsWithRootTag:(__unused NSInteger)rootTag
{
  if (self.invalidated) return;
  // Unlike addUIBlock, this callback runs after actual Fabric prop/state writes.
  for (NSNumber *tag in [_pendingInputs.allKeys copy]) [self attemptPendingTag:tag];
  [self stopPendingClockIfIdle];
}

- (void)preparePendingInputs
{
  if (self.invalidated) return;
  for (NSNumber *tag in [_pendingInputs.allKeys copy]) {
    AurelglyphSecureRequest *request = _pendingInputs[tag];
    [self attemptPendingTag:tag];
    if (_pendingInputs[tag] == request && --request.remainingFrames == 0) [_pendingInputs removeObjectForKey:tag];
  }
  [self stopPendingClockIfIdle];
}

- (void)inputDidBeginEditing:(NSNotification *)notification
{
  if (self.invalidated) return;
  // UIKit posts this synchronously, before a keystroke can outrun JS onFocus.
  // Observe globally, but repair only package-owned, registered TextInputs.
  for (NSNumber *tag in _registeredTags) {
    UITextField<RCTBackedTextInputViewProtocol> *field = AurelglyphTextField([self.viewRegistry_DEPRECATED viewForReactTag:tag]);
    if (field != [self->_ownedInputs objectForKey:tag]) {
      [self->_ownedInputs removeObjectForKey:tag];
    }
    if (field == notification.object) {
      [self cancelPendingForField:field];
      [self->_ownedInputs setObject:field forKey:tag];
      [self prepareField:field value:field.attributedText.string selection:nil];
      break;
    }
  }
}

RCT_EXPORT_METHOD(registerSecureInput:(nonnull NSNumber *)reactTag)
{
  [self.viewRegistry_DEPRECATED addUIBlock:^(RCTViewRegistry *registry) {
    if (self.invalidated) return;
    // A ref can arrive before Fabric's mount. Keep the tag pending so the
    // synchronous focus observer can resolve ownership once the view exists.
    [self->_registeredTags addObject:reactTag];
    UITextField<RCTBackedTextInputViewProtocol> *field = AurelglyphTextField([registry viewForReactTag:reactTag]);
    if (!field) return;
    [self->_ownedInputs setObject:field forKey:reactTag];
    // autoFocus may already have run before the registration command commits.
    [self prepareField:field value:field.attributedText.string selection:nil];
  }];
}

RCT_EXPORT_METHOD(unregisterSecureInput:(nonnull NSNumber *)reactTag)
{
  [self.viewRegistry_DEPRECATED addUIBlock:^(__unused RCTViewRegistry *registry) {
    if (self.invalidated) return;
    [self->_registeredTags removeObject:reactTag];
    [self->_ownedInputs removeObjectForKey:reactTag];
    [self->_pendingInputs removeObjectForKey:reactTag];
    [self stopPendingClockIfIdle];
  }];
}

RCT_EXPORT_METHOD(prepareSecureInput:(nonnull NSNumber *)reactTag
                  expectedValue:(nullable NSString *)expectedValue
                  selection:(nullable NSDictionary *)selection)
{
  [self.viewRegistry_DEPRECATED addUIBlock:^(RCTViewRegistry *registry) {
    if (self.invalidated) return;
    [self->_pendingInputs removeObjectForKey:reactTag];
    [self stopPendingClockIfIdle];
    // A reveal cancels an obsolete masked preparation without touching UIKit.
    if (!expectedValue || ![self->_registeredTags containsObject:reactTag]) return;
    UITextField<RCTBackedTextInputViewProtocol> *field = AurelglyphTextField([registry viewForReactTag:reactTag]);
    if (!field) {
      [self->_ownedInputs removeObjectForKey:reactTag];
      return;
    }
    [self->_ownedInputs setObject:field forKey:reactTag];
    if ([self prepareField:field value:expectedValue selection:selection]) return;
    if (!field.window || !field.isFirstResponder || !field.isEnabled || field.markedTextRange) return;
    // A missing native text range is terminal; only an uncommitted secure
    // trait or owner value can authorize post-commit catch-up.
    if (field.isSecureTextEntry && [field.attributedText.string isEqualToString:expectedValue]) return;
    AurelglyphSecureRequest *request = [AurelglyphSecureRequest new];
    request.field = field;
    request.value = expectedValue;
    request.remainingFrames = 2;
    self->_pendingInputs[reactTag] = request;
    // setTextAndSelection is a command, not a Fabric transaction. Bounded
    // frame catch-up also checks that path; it never rewrites mismatched text,
    // survives a user edit, or prepares more than once per current request.
    if (!self->_pendingDisplayLink) {
      AurelglyphSecureTick *target = [AurelglyphSecureTick new];
      target.owner = self;
      self->_pendingDisplayLink = [CADisplayLink displayLinkWithTarget:target selector:@selector(tick:)];
      [self->_pendingDisplayLink addToRunLoop:NSRunLoop.mainRunLoop forMode:NSRunLoopCommonModes];
    }
  }];
}
@end
