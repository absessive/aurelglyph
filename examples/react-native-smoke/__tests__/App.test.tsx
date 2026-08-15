/**
 * @format
 */

import ReactTestRenderer from 'react-test-renderer';
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
    const openModal = root.findByProps({accessibilityLabel: smokeLabels.openModal});
    await ReactTestRenderer.act(async () => openModal.props.onPress());

    expect(root.findByProps({accessibilityLabel: smokeLabels.modalActive})).toBeTruthy();
    expect(
      root.findAllByProps({testID: 'aurelglyph-overlay-host'}).length,
    ).toBeGreaterThanOrEqual(2);

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
