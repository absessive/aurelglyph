/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer';
import {StyleSheet, TextInput} from 'react-native';
import {Rating} from '@aurelglyph/react-native';
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
}, 15_000);

test('exercises the eight native essentials independently of overlay state', async () => {
  // Match the preceding native renderer case: isolate deferred native effects
  // behind a fresh fake-timer scope rather than switching act schedulers.
  jest.useFakeTimers();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  try {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
    if (!renderer) throw new Error('Smoke host did not mount');
    const root = renderer.root;
    const control = (label: string) => {
      const found = root.findAllByProps({accessibilityLabel: label})
        .find(node => typeof node.props.onPress === 'function');
      if (!found) throw new Error(`Missing native control: ${label}`);
      return found;
    };
    expect(root.findByProps({testID: 'component-expansion'})).toBeTruthy();
    const password = () => root.findAllByType(TextInput)
      .find(node => node.props.accessibilityLabel === 'Access password');
    expect(password()?.props.secureTextEntry).toBe(true);
    expect(password()?.props.autoComplete).toBe('current-password');
    await ReactTestRenderer.act(async () => control('Show Access password').props.onPress());
    expect(password()?.props.secureTextEntry).toBe(false);
    expect(password()?.props.value).toBe('sample-passphrase');
    await ReactTestRenderer.act(async () => control('Remove Local').props.onPress());
    expect(root.findAllByProps({accessibilityLabel: 'Remove Local'})).toHaveLength(0);
    await ReactTestRenderer.act(async () => control('Clear rating').props.onPress());
    expect(root.findByType(Rating).props.value).toBe(0);
    await ReactTestRenderer.act(async () => control('Limits').props.onPress());
    expect(root.findAll(node => node.props.children === 'Standard limits').length).toBeGreaterThan(0);
    expect(root.findAll(node => node.props.children === 'Local workspace')).toHaveLength(0);
    const configure = root.findAll(node =>
      node.props.accessibilityLabel === 'Configure, step 1 of 4, Completed'
      && typeof node.props.onPress === 'function'
    )[0];
    if (!configure) throw new Error('Missing step navigation');
    await ReactTestRenderer.act(async () => configure.props.onPress());
    expect(root.findAllByProps({accessibilityLabel: 'Configure, step 1 of 4, Current'}).length).toBeGreaterThan(0);
    const amount = root.findAllByType(TextInput)
      .find(node => node.props.accessibilityLabel === 'Amount');
    if (!amount) throw new Error('Missing owned amount input');
    await ReactTestRenderer.act(async () => amount.props.onChangeText('24.00'));
    expect(root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Amount')?.props.value).toBe('24.00');
    const review = root.findAll(node => node.props.children === 'Review fields' && typeof node.props.onPress === 'function')[0];
    if (!review) throw new Error('Missing review submission');
    await ReactTestRenderer.act(async () => review.props.onPress());
    expect(root.findAllByProps({accessibilityLabel: 'Review amount'}).length).toBeGreaterThan(0);
  } finally {
    if (renderer) await ReactTestRenderer.act(async () => renderer?.unmount());
    jest.clearAllTimers();
    jest.useRealTimers();
  }
}, 15_000);
