/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer';
import {StyleSheet} from 'react-native';
import App, {smokeLabels} from '../App';

test('mounts a modal-local host and leaves underlying controls operable', async () => {
  jest.useFakeTimers();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  try {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });

    const mountedRenderer = renderer;
    if (!mountedRenderer) throw new Error('Smoke host did not mount');
    const root = mountedRenderer.root;
    expect(
      root.findAllByProps({keyboardShouldPersistTaps: 'always'}).length,
    ).toBeGreaterThanOrEqual(1);
    expect(StyleSheet.flatten(root.findByProps({testID: 'quiet-smoke-status'}).props.style)).toMatchObject({
      backgroundColor: '#1d1d1e',
      borderRadius: 12,
      elevation: 1,
      shadowOffset: {height: 1, width: 0},
      shadowOpacity: 0.12,
      shadowRadius: 3,
    });
    expect(StyleSheet.flatten(root.findByProps({testID: 'quiet-smoke-signal'}).props.style)).toMatchObject({
      backgroundColor: '#7967cf',
    });
    const screenInformation = root.findAllByProps({
      accessibilityLabel: smokeLabels.screenInformation,
    }).find(node => typeof node.props.onPress === 'function');
    if (!screenInformation) throw new Error('Screen information trigger did not mount');
    await ReactTestRenderer.act(async () => screenInformation.props.onPress());
    expect(
      root.findAll(node =>
        node.props.children ===
        'This host verifies modal layering, host measurement, viewport clamping, and pointer passthrough.'
      ).length,
    ).toBeGreaterThanOrEqual(1);
    const closeScreenInformation = root.findByProps({
      accessibilityLabel: `Close ${smokeLabels.screenInformation}`,
    });
    await ReactTestRenderer.act(async () => closeScreenInformation.props.onPress());

    const openModal = root.findByProps({accessibilityLabel: smokeLabels.openModal});
    await ReactTestRenderer.act(async () => openModal.props.onPress());

    expect(root.findByProps({accessibilityLabel: smokeLabels.modalActive})).toBeTruthy();
    expect(StyleSheet.flatten(root.findByProps({testID: 'quiet-modal-panel'}).props.style)).toMatchObject({
      backgroundColor: '#1d1d1e',
      borderRadius: 12,
    });
    expect(
      root.findAllByProps({testID: 'aurelglyph-overlay-host'}).length,
    ).toBeGreaterThanOrEqual(2);
    const modalInformation = root.findAllByProps({
      accessibilityLabel: smokeLabels.modalInformation,
    }).find(node => typeof node.props.onPress === 'function');
    if (!modalInformation) throw new Error('Modal information trigger did not mount');
    await ReactTestRenderer.act(async () => modalInformation.props.onPress());
    expect(
      root.findAll(node =>
        node.props.children ===
        'The tooltip is rendered by an inner host in this native modal window.'
      ).length,
    ).toBeGreaterThanOrEqual(1);
    const closeModalInformation = root.findByProps({
      accessibilityLabel: `Close ${smokeLabels.modalInformation}`,
    });
    await ReactTestRenderer.act(async () => closeModalInformation.props.onPress());

    const underlyingAction = root.findByProps({
      accessibilityLabel: smokeLabels.underlyingAction,
    });
    await ReactTestRenderer.act(async () => underlyingAction.props.onPress());
    expect(root.findByProps({accessibilityLabel: 'Underlying taps: 1'})).toBeTruthy();
  } finally {
    if (renderer) {
      await ReactTestRenderer.act(async () => renderer?.unmount());
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  }
});
