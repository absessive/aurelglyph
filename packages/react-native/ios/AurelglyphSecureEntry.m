#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTBridgeModule.h>
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

static void AurelglyphPrepareField(UITextField<RCTBackedTextInputViewProtocol> *field, NSString *expectedValue, NSDictionary *selection)
{
    if (!field.window || !field.isFirstResponder || !field.isSecureTextEntry || !field.isEnabled ||
        field.markedTextRange ||
        ![field.attributedText.string isEqualToString:expectedValue]) return;
    NSString *value = [field.attributedText.string copy];
    UITextRange *entireValue = [field textRangeFromPosition:field.beginningOfDocument toPosition:field.endOfDocument];
    if (!entireValue) return;
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
}

@interface AurelglyphSecureEntry : NSObject <RCTBridgeModule>
@end

@implementation AurelglyphSecureEntry {
  NSMutableSet<NSNumber *> *_registeredTags;
  NSMapTable<NSNumber *, UITextField<RCTBackedTextInputViewProtocol> *> *_ownedInputs;
}

@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;
RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup { return NO; }

- (instancetype)init
{
  if ((self = [super init])) {
    _registeredTags = [NSMutableSet new];
    _ownedInputs = [NSMapTable strongToWeakObjectsMapTable];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(inputDidBeginEditing:)
      name:UITextFieldTextDidBeginEditingNotification object:nil];
  }
  return self;
}

- (void)dealloc { [[NSNotificationCenter defaultCenter] removeObserver:self]; }

- (void)inputDidBeginEditing:(NSNotification *)notification
{
  // UIKit posts this synchronously, before a keystroke can outrun JS onFocus.
  // Observe globally, but repair only package-owned, registered TextInputs.
  for (NSNumber *tag in _registeredTags) {
    UITextField<RCTBackedTextInputViewProtocol> *field = AurelglyphTextField([self.viewRegistry_DEPRECATED viewForReactTag:tag]);
    if (field != [self->_ownedInputs objectForKey:tag]) {
      [self->_ownedInputs removeObjectForKey:tag];
    }
    if (field == notification.object) {
      [self->_ownedInputs setObject:field forKey:tag];
      AurelglyphPrepareField(field, field.attributedText.string, nil);
      break;
    }
  }
}

RCT_EXPORT_METHOD(registerSecureInput:(nonnull NSNumber *)reactTag)
{
  [self.viewRegistry_DEPRECATED addUIBlock:^(RCTViewRegistry *registry) {
    // A ref can arrive before Fabric's mount. Keep the tag pending so the
    // synchronous focus observer can resolve ownership once the view exists.
    [self->_registeredTags addObject:reactTag];
    UITextField<RCTBackedTextInputViewProtocol> *field = AurelglyphTextField([registry viewForReactTag:reactTag]);
    if (!field) return;
    [self->_ownedInputs setObject:field forKey:reactTag];
    // autoFocus may already have run before the registration command commits.
    AurelglyphPrepareField(field, field.attributedText.string, nil);
  }];
}

RCT_EXPORT_METHOD(unregisterSecureInput:(nonnull NSNumber *)reactTag)
{
  [self.viewRegistry_DEPRECATED addUIBlock:^(__unused RCTViewRegistry *registry) {
    [self->_registeredTags removeObject:reactTag];
    [self->_ownedInputs removeObjectForKey:reactTag];
  }];
}

RCT_EXPORT_METHOD(prepareSecureInput:(nonnull NSNumber *)reactTag
                  expectedValue:(NSString *)expectedValue
                  selection:(NSDictionary *)selection)
{
  [self.viewRegistry_DEPRECATED addUIBlock:^(RCTViewRegistry *registry) {
    if (![self->_registeredTags containsObject:reactTag]) return;
    UITextField<RCTBackedTextInputViewProtocol> *field = AurelglyphTextField([registry viewForReactTag:reactTag]);
    if (!field) {
      [self->_ownedInputs removeObjectForKey:reactTag];
      return;
    }
    [self->_ownedInputs setObject:field forKey:reactTag];
    AurelglyphPrepareField(field, expectedValue, selection);
  }];
}
@end
