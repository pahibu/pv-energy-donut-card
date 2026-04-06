# Configuration Reference

## Card options

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `type` | string | yes |  | Must be `custom:pv-energy-donut-card` |
| `title` | string | no |  | Optional card title |
| `locale` | string | no | HA locale | Overrides number formatting locale |
| `mode` | string | no | `simple` | `simple` uses current entity states, `time_navigator` adds day/month/year navigation |
| `value_precision` | number | no | `1` | Decimal places for segment values |
| `total_precision` | number | no | `1` | Decimal places for center total |
| `charts` | array | yes |  | One or two chart definitions |

## Chart options

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `key` | string | no | derived | Stable chart key |
| `title` | string | no | `Chart 1` / `Chart 2` | Center title text |
| `unit` | string | no | `kWh` | Unit shown in labels and totals |
| `no_data_text` | string | no | `No numeric energy data available` | Fallback when all values are zero |
| `segments` | array | yes |  | Segment list |

## Segment options

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `entity` | string | yes |  | Home Assistant entity providing an energy value |
| `daily_entity` | string | no |  | Optional day sensor used for the current day instead of the cumulative entity |
| `label` | string | no | derived | Display label |
| `color` | string | no | palette | Arc, connector, and percentage color |
