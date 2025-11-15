# Cancelación y reactivación de centros culturales

Este documento resume los endpoints disponibles para cancelar o reactivar centros culturales por coordenadas, los parámetros requeridos y los distintos estados involucrados en la vida del centro (y el efecto que cada uno genera sobre los eventos asociados).

## Endpoints

| Acción | Método y ruta | DTO / payload esperado | Descripción |
| --- | --- | --- | --- |
| Cancelar por coordenadas puntuales | `POST /cultural-places/cancel-by-location` | `{ latitude: number, longitude: number, status: 'CLOSED_DOWN' \| 'TEMPORAL_CLOSED_DOWN' }` | Busca el centro más cercano a la coordenada exacta y lo cancela con el estado indicado. |
| Cancelar por rango | `POST /cultural-places/cancel-by-range` | `{ latitude: number, longitude: number, radiusInMeters: number (>0), status: 'CLOSED_DOWN' \| 'TEMPORAL_CLOSED_DOWN' }` | Cancela todos los centros activos dentro del radio (en metros). |
| Reactivar por coordenadas puntuales | `POST /cultural-places/activate-by-location` | `{ latitude: number, longitude: number }` | Activa nuevamente el centro localizado en esa coordenada (lo deja en `ACTIVE`). |
| Reactivar por rango | `POST /cultural-places/activate-by-range` | `{ latitude: number, longitude: number, radiusInMeters: number (>0) }` | Reactiva todos los centros inactivos dentro del radio. |

Notas:
- Las coordenadas se validan con `IsLatitude` / `IsLongitude`, y el radio debe ser mayor a cero.

## Estados de los centros culturales

| Estado | Quién lo setea | Significado | Impacto en eventos |
| --- | --- | --- | --- |
| `ACTIVE` | Creación, reactivaciones | Centro operativo | Los eventos vuelven a estar disponibles (se reactivan). |
| `CLOSED_DOWN` | Endpoints de cancelación (definitiva) | Clausura definitiva | Se cancelan todos los eventos futuros del centro (`PAUSED_BY_CLOSURE`). |
| `TEMPORAL_CLOSED_DOWN` | Endpoints de cancelación (temporal) | Clausura temporal (se cancelan los eventos programados para ese día) | Los eventos del día se marcan como `TEMPORAL_PAUSED`; el resto permanece igual. |

## Ejemplos cURL

```bash
# Cancelar un centro puntual con clausura definitiva
curl -X POST https://<host>/cultural-places/cancel-by-location \
  -H 'Content-Type: application/json' \
  -d '{
        "latitude": -34.6037,
        "longitude": -58.3816,
        "status": "CLOSED_DOWN"
      }'

# Clausura temporal masiva en 500 metros
curl -X POST https://<host>/cultural-places/cancel-by-range \
  -H 'Content-Type: application/json' \
  -d '{
        "latitude": -34.6037,
        "longitude": -58.3816,
        "radiusInMeters": 500,
        "status": "TEMPORAL_CLOSED_DOWN"
      }'
```

## Flujo resumido

1. **Solicitud HTTP** (cancel/activate) → `CulturalPlacesController` → `CulturalPlacesService`.
2. El servicio localiza el centro (por coordenada o rango), actualiza `status` e `isActive`.
3. Dependiendo del nuevo estado:
   - `CLOSED_DOWN`: todos los eventos del centro se cancelan.
   - `TEMPORAL_CLOSED_DOWN`: solo se cancelan los eventos del día en curso.
   - `ACTIVE`: los eventos se reactivan normalmente.

Este README debería ayudarte a identificar rápidamente qué endpoint usar y qué efecto tendrá sobre los centros culturales.


