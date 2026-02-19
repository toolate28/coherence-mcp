---
name: forge-monitor
description: >
  Hardware telemetry and monitoring skill for the Reson8 Forge. Use when the user mentions
  "forge status", "hardware monitoring", "PCH temperature", "vibration", "sensor data",
  "TUI dashboard", "system health", "thermal", or wants real-time monitoring of the
  physical compute infrastructure. Bridges sensor data to the Rust TUI sparklines.
version: 1.0.0
---

# Forge Monitor — Hardware Telemetry Skill

The Forge is the physical compute infrastructure running Reson8-Labs workloads.
This skill bridges hardware sensors to the orchestration layer, enabling:

1. **Sensor Reading** — temperature, vibration, power, fan speed
2. **Health Assessment** — threshold checking and anomaly detection
3. **TUI Integration** — forward telemetry to Rust TUI sparklines
4. **Coherence Correlation** — relate hardware state to compute coherence

## Sensor Map

| Sensor | Protocol | Location | Normal Range |
|--------|----------|----------|-------------|
| PCH Temperature | Modbus RTU / I2C | Chipset | 40-75°C |
| CPU Temperature | lm-sensors / WMI | Processor | 30-85°C |
| GPU Temperature | nvidia-smi / rocm-smi | Graphics | 30-90°C |
| Vibration (PCH 1232) | Modbus RTU | Chassis | 0-2.5 mm/s |
| Power Draw | IPMI / PDU | PSU | 100-800W |
| Fan Speed | lm-sensors / WMI | Case fans | 600-2000 RPM |
| Disk I/O | iostat | Storage | varies |
| Network Throughput | /proc/net/dev | NIC | varies |

## Reading Sensors

### Linux
```bash
# Temperature
sensors -j | jq '.["coretemp-isa-0000"]["Package id 0"].temp1_input'

# GPU (NVIDIA)
nvidia-smi --query-gpu=temperature.gpu,power.draw,fan.speed --format=csv,noheader

# Disk I/O
iostat -d -o JSON 1 1

# Vibration (Modbus RTU via pymodbus)
python3 -c "
from pymodbus.client import ModbusSerialClient
client = ModbusSerialClient('/dev/ttyUSB0', baudrate=9600)
client.connect()
result = client.read_holding_registers(0x0001, 1, unit=1)
print(f'Vibration: {result.registers[0] / 100} mm/s')
"
```

### Windows
```powershell
# Temperature via WMI
Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace "root/wmi" |
  Select-Object InstanceName, @{N='TempC';E={($_.CurrentTemperature - 2732) / 10}}

# GPU (NVIDIA)
nvidia-smi --query-gpu=temperature.gpu,power.draw,fan.speed --format=csv,noheader
```

## TUI Bridge

Telemetry data flows to the Rust TUI via the POP WebSocket:

```json
{
  "jsonrpc": "2.0",
  "method": "TELEMETRY_UPDATE",
  "params": {
    "timestamp": 1708041600000,
    "sensors": {
      "cpu_temp": 62.5,
      "gpu_temp": 71.0,
      "vibration": 1.2,
      "power_draw": 385,
      "fan_speed": 1450
    },
    "health": "nominal",
    "coherence_correlation": 0.92
  }
}
```

The TUI renders these as sparkline charts with configurable thresholds.

## Health Assessment

Assess overall forge health by checking all sensors against thresholds:

| Level | Criteria | Action |
|-------|----------|--------|
| NOMINAL | All sensors in normal range | Continue operations |
| CAUTION | Any sensor within 10% of limit | Log warning, increase monitoring |
| WARNING | Any sensor exceeding soft limit | Throttle workloads, alert user |
| CRITICAL | Any sensor exceeding hard limit | Emergency shutdown of workloads |

## Coherence Correlation

The hypothesis: hardware state affects compute coherence.

Track the relationship between:
- CPU temperature ↔ WAVE scoring latency
- Vibration levels ↔ inference quality (measured by WAVE)
- Power stability ↔ session reliability

Log these correlations to the ATOM trail for longitudinal analysis.
Over time, this data reveals the physical substrate's influence on
the coherence of AI outputs — the conservation law extending to hardware.

## Grok Integration

This skill is primarily operated by Grok (the Real-Time & Social Intelligence strand).
Grok's Rust TUI dashboard (crates/tui) renders the telemetry data.

For Grok: read `references/sensor-map.md` for detailed Modbus register addresses
and `references/tui-bridge.md` for the exact WebSocket message format expected by
the TUI gauge widgets.
