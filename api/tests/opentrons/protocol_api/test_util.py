import pytest

from opentrons.protocol_api.util import HardwareManager, AxisMaxSpeeds
from opentrons.hardware_control import API, adapters, types


def test_hw_manager(loop):
    # When built without an input it should build its own adapter
    mgr = HardwareManager(None)
    assert mgr._is_orig
    assert mgr._built_own_adapter
    adapter = mgr.hardware
    # When "disconnecting" from its own simulator, the adapter should
    # be stopped and a new one created
    assert adapter.is_alive()
    new = mgr.reset_hw()
    assert new is not adapter
    assert not adapter.is_alive()
    # When deleted, the self-created adapter should be stopped
    del mgr
    assert not new.is_alive()

    # When built with a hardware API input it should wrap it with a new
    # synchronous adapter and not build its own API
    mgr = HardwareManager(
        API.build_hardware_simulator(loop=loop))
    assert isinstance(mgr.hardware, adapters.SynchronousAdapter)
    assert not mgr._is_orig
    assert mgr._built_own_adapter
    passed = mgr.hardware
    # When disconnecting from a real external adapter, it should create
    # its own simulator and should stop the old hardware thread
    new = mgr.reset_hw()
    assert new is not passed
    assert mgr._is_orig
    assert mgr._built_own_adapter
    assert not passed.is_alive()

    sa = adapters.SynchronousAdapter.build(API.build_hardware_simulator)
    # When connecting to an adapter it shouldn’t rewrap it
    assert mgr.set_hw(sa) is sa
    # And should kill its old one
    assert not new.is_alive()
    # it should know it didn't build its own adapter
    assert not mgr._built_own_adapter
    del mgr
    # but not its new one, even if deleted
    assert sa.is_alive()


def test_max_speeds_userdict():
    defaults = AxisMaxSpeeds()
    assert defaults.data == {}
    assert dict(defaults) == {}

    with pytest.raises(KeyError):
        defaults['asdas'] = 2

    with pytest.raises(AssertionError):
        defaults['x'] = -1

    with pytest.raises(AssertionError):
        defaults['y'] = 'ggg'

    with pytest.raises(KeyError):
        defaults['b'] = 2

    with pytest.raises(KeyError):
        defaults['c'] = 3

    defaults['x'] = 2
    defaults[types.Axis.A] = 20

    assert defaults['X'] == 2
    assert defaults['x'] == 2
    assert defaults[types.Axis.X] == 2

    assert defaults['A'] == 20
    assert defaults['a'] == 20
    assert defaults[types.Axis.A] == 20

    assert sorted(list(defaults.keys()))\
        == sorted(['X', 'A'])
    assert 'X' in defaults.keys()

    del defaults['A']
    assert 'A' not in defaults

    defaults['x'] = None
    assert 'x' not in defaults
