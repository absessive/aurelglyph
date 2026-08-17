import {useState} from 'react';
import {
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AurelglyphOverlayHost,
  AurelglyphProvider,
  Button,
  Icon,
  IconButton,
  Tooltip,
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
  moveAnchor: 'Move tooltip anchor',
  openModal: 'Open native modal',
  tooltip: 'Hosted modal signal · bounded precision overlay calibration',
  underlyingAction: 'Underlying action',
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
            <IconButton
              icon={<Icon name="close" />}
              label={smokeLabels.closeModal}
              onPress={onClose}
              variant="ghost"
            />
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
            <Text style={[styles.body, {color: theme.colors.text}]}>The tooltip below is rendered by an inner host in this native modal window.</Text>

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

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.calibrationLine, {borderTopColor: theme.colors.focus}]} />
      <Text style={[styles.eyebrow, {color: theme.colors.focus}]}>AURELGLYPH · RN 0.86</Text>
      <Text style={[styles.title, {color: theme.colors.text}]}>Native overlay test host</Text>
      <Text style={[styles.body, {color: theme.colors.muted}]}>A focused runtime surface for modal layering, host measurement, viewport clamping, and pointer passthrough.</Text>
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
      {modalOpen ? <NativeModalSmoke insets={insets} onClose={() => setModalOpen(false)} /> : null}
    </View>
  );
}

function ThemedSmokeHost() {
  const insets = useSafeAreaInsets();
  return (
    <AurelglyphProvider accent="royal-purple" appearance="quiet" mode="dark" overlayInsets={insets}>
      <SmokeWorkbench />
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
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
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
  signalDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  statusCopy: {
    flex: 1,
    gap: 3,
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
});

export default App;
