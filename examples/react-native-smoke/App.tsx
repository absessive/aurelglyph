import {useRef, useState} from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import {
  AurelglyphOverlayHost,
  AurelglyphProvider,
  Accordion,
  Button,
  Chip,
  Combobox,
  CommandPalette,
  Icon,
  IconButton,
  InputGroup,
  Link,
  MoreInformation,
  PasswordField,
  Rating,
  Menu,
  SegmentedControl,
  Select,
  Stepper,
  Tooltip,
  ValidationSummary,
  useAurelglyphTheme,
} from '@aurelglyph/react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
  type EdgeInsets,
} from 'react-native-safe-area-context';

export const smokeLabels = {
  closeModal: 'Close native modal',
  modalActive: 'Native modal active',
  modalInformation: 'About modal calibration',
  moveAnchor: 'Move tooltip anchor',
  openCommandPalette: 'Open command palette',
  openModal: 'Open native modal',
  screenInformation: 'About the native overlay host',
  tooltip: 'Hosted modal signal · bounded precision overlay calibration',
  underlyingAction: 'Underlying action',
  operations: 'Operations',
} as const;

function NativeModalSmoke({insets, onClose}: {insets: EdgeInsets; onClose: () => void}) {
  const theme = useAurelglyphTheme();
  const [anchorAtStart, setAnchorAtStart] = useState(false);
  const [underlyingTaps, setUnderlyingTaps] = useState(0);

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      visible>
      <AurelglyphOverlayHost insets={insets}>
        <View
          accessibilityLabel={smokeLabels.modalActive}
          style={[styles.modalCanvas, {backgroundColor: theme.colors.background}]}>
          <View style={styles.modalHeader}>
            <View style={styles.headingGroup}>
              <Text style={[styles.eyebrow, {color: theme.colors.focus}]}>LIVE · NATIVE WINDOW</Text>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>Overlay host calibration</Text>
            </View>
            <View style={styles.headerActions}>
              <MoreInformation
                label={smokeLabels.modalInformation}
                placement="top"
                triggerLabel="">
                <Text style={[styles.body, {color: theme.colors.text}]}>The tooltip is rendered by an inner host in this native modal window.</Text>
              </MoreInformation>
              <IconButton
                icon={<Icon name="close" />}
                label={smokeLabels.closeModal}
                onPress={onClose}
                variant="ghost"
              />
            </View>
          </View>

          <View
            testID="quiet-modal-panel"
            style={[
              styles.instrumentPanel,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.lg,
              },
            ]}>
            <Text style={[styles.panelLabel, {color: theme.colors.muted}]}>CONSUMER-OWNED MODAL</Text>

            <View style={styles.anchorRail}>
              <Tooltip
                label={smokeLabels.tooltip}
                placement={anchorAtStart ? 'left' : 'right'}
                style={anchorAtStart ? styles.tooltipAtCenter : styles.tooltipAtEnd}
                visible>
                <IconButton
                  icon={<Icon name="info" />}
                  label="Modal tooltip trigger"
                  variant="secondary"
                />
              </Tooltip>
            </View>

            <View style={styles.actionStack}>
              <Button
                accessibilityLabel={smokeLabels.underlyingAction}
                onPress={() => setUnderlyingTaps(current => current + 1)}
                variant="secondary">
                Exercise underlying control
              </Button>
              <Text
                accessibilityLabel={`Underlying taps: ${underlyingTaps}`}
                style={[styles.counter, {color: theme.colors.text}]}>
                Underlying taps: {underlyingTaps}
              </Text>
              <Button
                accessibilityLabel={smokeLabels.moveAnchor}
                onPress={() => setAnchorAtStart(current => !current)}
                variant="ghost">
                Move anchor to clamp zone
              </Button>
            </View>
          </View>
        </View>
      </AurelglyphOverlayHost>
    </Modal>
  );
}

function SmokeWorkbench() {
  const theme = useAurelglyphTheme();
  const insets = useSafeAreaInsets();
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [releaseChannel, setReleaseChannel] = useState('stable');
  const [searchableChannel, setSearchableChannel] = useState('stable');
  const [lastAction, setLastAction] = useState('None');
  const [lastCommand, setLastCommand] = useState('None');

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      style={[styles.scroll, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={[styles.calibrationLine, {borderTopColor: theme.colors.focus}]} />
      <View style={styles.workbenchHeader}>
        <View style={styles.headingGroup}>
          <Text style={[styles.eyebrow, {color: theme.colors.focus}]}>AURELGLYPH · RN 0.87</Text>
          <Text style={[styles.title, {color: theme.colors.text}]}>Native overlay test host</Text>
        </View>
        <MoreInformation label={smokeLabels.screenInformation} placement="top" triggerLabel="">
          <Text style={[styles.body, {color: theme.colors.text}]}>This host verifies modal layering, host measurement, viewport clamping, and pointer passthrough.</Text>
        </MoreInformation>
      </View>
      <View
        testID="quiet-smoke-status"
        style={[
          styles.statusPanel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            elevation: theme.effects.raised.elevation,
            shadowColor: theme.colors.shadow,
            shadowOffset: {height: theme.effects.raised.offsetY, width: 0},
            shadowOpacity: theme.effects.raised.opacity,
            shadowRadius: theme.effects.raised.radius,
          },
        ]}>
        <View testID="quiet-smoke-signal" style={[styles.signalDot, {backgroundColor: theme.colors.accent}]} />
        <View style={styles.statusCopy}>
          <Text style={[styles.panelLabel, {color: theme.colors.muted}]}>SYSTEMS OPERATIONAL</Text>
          <Text style={[styles.statusText, {color: theme.colors.text}]}>Root overlay host mounted</Text>
        </View>
      </View>
      <Button accessibilityLabel={smokeLabels.openModal} onPress={() => setModalOpen(true)}>
        Open native modal
      </Button>
      <View style={styles.controlStack}>
        <Select
          label="Release channel"
          onValueChange={setReleaseChannel}
          options={[
            {label: 'Stable', value: 'stable'},
            {disabled: true, label: 'Nightly', value: 'nightly'},
            {label: 'Beta', value: 'beta'},
          ]}
          value={releaseChannel}
        />
        <Text
          accessibilityLabel={`Channel: ${releaseChannel === 'beta' ? 'Beta' : 'Stable'}`}
          style={[styles.counter, {color: theme.colors.text}]}>
          Channel: {releaseChannel === 'beta' ? 'Beta' : 'Stable'}
        </Text>
        <Combobox
          label="Searchable channel"
          onValueChange={setSearchableChannel}
          options={[
            {label: 'Stable', value: 'stable'},
            {disabled: true, label: 'Nightly', value: 'nightly'},
            {label: 'Beta', value: 'beta'},
          ]}
          value={searchableChannel}
        />
        <Button
          accessibilityLabel={smokeLabels.openCommandPalette}
          onPress={() => setCommandPaletteOpen(true)}
          variant="secondary">
          Open command palette
        </Button>
        <Text
          accessibilityLabel={`Last command: ${lastCommand}`}
          style={[styles.counter, {color: theme.colors.text}]}>
          Last command: {lastCommand}
        </Text>
        <CommandPalette
          items={[
            {
              id: 'archive',
              label: 'Archive systems',
              onSelect: () => setLastCommand('Archive systems'),
            },
            {
              id: 'synchronize',
              label: 'Synchronize systems',
              onSelect: () => setLastCommand('Synchronize systems'),
            },
            {
              id: 'apply-changes',
              label: 'Apply changes',
              onSelect: () => setLastCommand('Apply changes'),
            },
          ]}
          onOpenChange={setCommandPaletteOpen}
          open={commandPaletteOpen}
        />
        <Button
          accessibilityLabel={smokeLabels.operations}
          onPress={() => setMenuOpen(true)}
          variant="secondary">
          Operations
        </Button>
        <Text
          accessibilityLabel={`Last action: ${lastAction}`}
          style={[styles.counter, {color: theme.colors.text}]}>
          Last action: {lastAction}
        </Text>
        <Menu
          accessibilityLabel={smokeLabels.operations}
          items={[
            {label: 'Sync now', onSelect: () => setLastAction('Sync requested'), value: 'sync'},
            {disabled: true, label: 'Requires approval', value: 'approval'},
            {danger: true, label: 'Archive draft', onSelect: () => setLastAction('Draft archived'), value: 'archive'},
          ]}
          onOpenChange={setMenuOpen}
          open={menuOpen}
        />
      </View>
      <ExpansionWorkbench />
      {modalOpen ? <NativeModalSmoke insets={insets} onClose={() => setModalOpen(false)} /> : null}
    </ScrollView>
  );
}

function ExpansionWorkbench() {
  const theme = useAurelglyphTheme();
  const amountInput = useRef<TextInputInstance>(null);
  const passwordInput = useRef<TextInputInstance>(null);
  const [amount, setAmount] = useState('12.50');
  const [chipVisible, setChipVisible] = useState(true);
  const [selected, setSelected] = useState(true);
  const [rating, setRating] = useState(3);
  const [step, setStep] = useState('review');
  const [submission, setSubmission] = useState(0);
  return (
    <View style={styles.controlStack} testID="component-expansion">
      <Text accessibilityRole="header" style={[styles.panelLabel, {color: theme.colors.text}]}>COMPONENT ESSENTIALS</Text>
      <Link external href="https://aurelglyph.absessive.com/">Documentation</Link>
      <Link disabled href="https://aurelglyph.absessive.com/">Unavailable destination</Link>
      {chipVisible ? <Chip label="Local" onRemove={() => setChipVisible(false)} onSelectedChange={setSelected} selected={selected} />
        : <Button onPress={() => setChipVisible(true)} variant="ghost">Restore local filter</Button>}
      <PasswordField defaultValue="sample-passphrase" inputRef={passwordInput} label="Access password" />
      <InputGroup addonDescription="US dollars" inputRef={amountInput} keyboardType="decimal-pad" label="Amount" onChangeText={setAmount} prefix="$" suffix="USD" value={amount} />
      <Button onPress={() => setSubmission(current => current + 1)} variant="secondary">Review fields</Button>
      <ValidationSummary
        announcementKey={submission || undefined}
        errors={submission ? [
          {id: 'access', message: 'Review access password', onPress: () => passwordInput.current?.focus()},
          {id: 'amount', message: 'Review amount', onPress: () => amountInput.current?.focus()},
        ] : []}
        focusKey={submission || undefined}
      />
      <Accordion defaultValue={['details']} items={[
        {id: 'details', title: 'Details', content: <Text style={[styles.body, {color: theme.colors.text}]}>Local workspace</Text>},
        {id: 'limits', title: 'Limits', content: <Text style={[styles.body, {color: theme.colors.text}]}>Standard limits</Text>},
        {disabled: true, id: 'archive', title: 'Archive', content: <Text style={[styles.body, {color: theme.colors.text}]}>Requires approval</Text>},
      ]} />
      <Stepper currentId={step} items={[
        {id: 'configure', label: 'Configure'},
        {id: 'review', label: 'Review'},
        {id: 'approve', label: 'Approve'},
        {disabled: true, id: 'publish', label: 'Publish'},
      ]} onStepChange={setStep} />
      <Rating label="Interface quality" onValueChange={setRating} value={rating} />
    </View>
  );
}

function SmokeThemeControls({
  appearance,
  mode,
  onAppearanceChange,
  onModeChange,
}: {
  appearance: 'atelier' | 'quiet';
  mode: 'dark' | 'light';
  onAppearanceChange: (appearance: 'atelier' | 'quiet') => void;
  onModeChange: (mode: 'dark' | 'light') => void;
}) {
  const theme = useAurelglyphTheme();
  return (
    <View style={[styles.themeControls, {backgroundColor: theme.colors.background}]}>
      <SegmentedControl
        items={[{label: 'Light', value: 'light'}, {label: 'Dark', value: 'dark'}]}
        label="Color mode"
        onValueChange={value => onModeChange(value as 'dark' | 'light')}
        value={mode}
      />
      <SegmentedControl
        items={[{label: 'Quiet', value: 'quiet'}, {label: 'Atelier', value: 'atelier'}]}
        label="Surface language"
        onValueChange={value => onAppearanceChange(value as 'atelier' | 'quiet')}
        value={appearance}
      />
      <Text
        accessibilityLabel={`Theme: ${mode === 'dark' ? 'Dark' : 'Light'} · ${appearance === 'atelier' ? 'Atelier' : 'Quiet'}`}
        style={[styles.counter, {color: theme.colors.text}]}>
        Theme: {mode === 'dark' ? 'Dark' : 'Light'} · {appearance === 'atelier' ? 'Atelier' : 'Quiet'}
      </Text>
    </View>
  );
}

function ThemedSmokeHost() {
  const insets = useSafeAreaInsets();
  const [appearance, setAppearance] = useState<'atelier' | 'quiet'>('quiet');
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  return (
    <AurelglyphProvider accent="royal-purple" appearance={appearance} mode={mode} overlayInsets={insets}>
      <View style={styles.host}>
        <SmokeThemeControls
          appearance={appearance}
          mode={mode}
          onAppearanceChange={setAppearance}
          onModeChange={setMode}
        />
        <SmokeWorkbench />
      </View>
    </AurelglyphProvider>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemedSmokeHost />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 20,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  controlStack: {
    gap: 12,
  },
  actionStack: {
    gap: 12,
  },
  anchorRail: {
    minHeight: 96,
    justifyContent: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  calibrationLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    width: 64,
  },
  counter: {
    fontSize: 14,
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  headingGroup: {
    flex: 1,
    gap: 4,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  host: {
    flex: 1,
  },
  instrumentPanel: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 18,
    padding: 20,
  },
  modalCanvas: {
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'Libre Baskerville',
    fontSize: 24,
    lineHeight: 31,
  },
  panelLabel: {
    fontFamily: 'Space Mono',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  scroll: {
    flex: 1,
  },
  signalDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  statusCopy: {
    flex: 1,
    gap: 3,
  },
  themeControls: {
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  statusPanel: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statusText: {
    fontSize: 15,
  },
  title: {
    fontFamily: 'Libre Baskerville',
    fontSize: 38,
    letterSpacing: -1.1,
    lineHeight: 46,
  },
  tooltipAtEnd: {
    alignSelf: 'flex-end',
  },
  tooltipAtCenter: {
    alignSelf: 'center',
  },
  workbenchHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
});

export default App;
