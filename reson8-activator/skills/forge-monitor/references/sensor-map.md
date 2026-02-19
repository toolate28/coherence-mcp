# Sensor Map — Modbus Register Addresses & I2C Configuration

## Vibration Sensor (PCH 1232)

| Register | Address | Type | Scale | Unit |
|----------|---------|------|-------|------|
| X-axis velocity | 0x0001 | Holding | /100 | mm/s |
| Y-axis velocity | 0x0002 | Holding | /100 | mm/s |
| Z-axis velocity | 0x0003 | Holding | /100 | mm/s |
| Temperature | 0x0004 | Holding | /10 | °C |
| Status | 0x0005 | Holding | bitmap | - |

**Connection:** RS-485 via USB adapter (/dev/ttyUSB0 or COM3)
**Baud rate:** 9600
**Slave address:** 1
**Protocol:** Modbus RTU

## Temperature Sensors (I2C / lm-sensors)

| Sensor | Chip | Address | Type |
|--------|------|---------|------|
| CPU Package | coretemp | ISA 0000 | Digital thermal sensor |
| CPU Core 0-N | coretemp | ISA 0000 | Per-core DTS |
| PCH | pch_cannonlake | ISA 0001 | Platform Controller Hub |
| NVMe | nvme | PCI | Drive temperature |
| Memory | - | SPD 0x50+ | DIMM thermal sensor |

## GPU Sensors

### NVIDIA (nvidia-smi)
| Metric | Query Flag | Unit |
|--------|-----------|------|
| Temperature | temperature.gpu | °C |
| Power Draw | power.draw | W |
| Fan Speed | fan.speed | % |
| Memory Used | memory.used | MiB |
| GPU Utilization | utilization.gpu | % |
| Memory Utilization | utilization.memory | % |

### AMD (rocm-smi)
| Metric | Flag | Unit |
|--------|------|------|
| Temperature | --showtemp | °C |
| Power Draw | --showpower | W |
| Fan Speed | --showfan | RPM |

## Thresholds

| Sensor | Soft Limit | Hard Limit |
|--------|-----------|------------|
| CPU Temperature | 80°C | 95°C |
| GPU Temperature | 85°C | 100°C |
| PCH Temperature | 70°C | 85°C |
| Vibration (any axis) | 2.0 mm/s | 3.5 mm/s |
| Power Draw | 90% of PSU rating | 95% of PSU rating |
| Fan Speed | < 400 RPM (stall) | 0 RPM (failure) |
