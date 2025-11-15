# Cancelación y reactivación de centros culturales

Este documento resume los endpoints disponibles para cancelar o reactivar centros culturales por coordenadas, los parámetros requeridos y los distintos estados involucrados tanto para los lugares como para los eventos asociados.

## Endpoints

| Acción | Método y ruta | DTO / payload esperado | Descripción |
| --- | --- | --- | --- |
| Cancelar por coordenadas puntuales | `POST /cultural-places/cancel-by-location` | `{ latitude: number, longitude: number, status: 'CLOSED_DOWN' \| 'TEMPORAL_CLOSED_DOWN' }` | Busca el centro más cercano a la coordenada exacta y lo cancela con el estado indicado. |
| Cancelar por rango | `POST /cultural-places/cancel-by-range` | `{ latitude: number, longitude: number, radiusInMeters: number (>0), status: 'CLOSED_DOWN' \| 'TEMPORAL_CLOSED_DOWN' }` | Cancela todos los centros activos dentro del radio (en metros). |
| Reactivar por coordenadas puntuales | `POST /cultural-places/activate-by-location` | `{ latitude: number, longitude: number }` | Activa nuevamente el centro localizado en esa coordenada (lo deja en `ACTIVE`). |
| Reactivar por rango | `POST /cultural-places/activate-by-range` | `{ latitude: number, longitude: number, radiusInMeters: number (>0) }` | Reactiva todos los centros inactivos dentro del radio. |

Notas:
- Todos los endpoints requieren autenticación (guard `JwtAuthGuard`) salvo que el módulo se configure distinto.
- Las coordenadas se validan con `IsLatitude` / `IsLongitude`, y el radio debe ser mayor a cero.

## Estados de los centros culturales

| Estado | Quién lo setea | Significado | Impacto en eventos |
| --- | --- | --- | --- |
| `ACTIVE` | Creación, reactivaciones | Centro operativo | Los handlers CDC de activación reactivan los eventos (`status: 'ACTIVE'`, `isActive: true`). |
| `CLOSED_DOWN` | Endpoints de cancelación (definitiva) | Clausura definitiva | Handler `CulturalPlaceClausureHandler` pausa **todos** los eventos del centro (`status: 'PAUSED_BY_CLOSURE'`, `isActive: false`). |
| `TEMPORAL_CLOSED_DOWN` | Endpoints de cancelación (temporal) | Clausura temporal (solo por el día) | Handler `CulturalPlaceTemporalClausureHandler` pausa únicamente los eventos del día corriente (`status: 'TEMPORAL_PAUSED'`, `isActive: false`). |

## Estados resultantes en eventos

| Estado de evento | Cuándo se aplica | Qué correo recibe el usuario |
| --- | --- | --- |
| `PAUSED_BY_CLOSURE` | Clausura definitiva del lugar (`CLOSED_DOWN`) | Email de cancelación con motivo “El evento fue cancelado porque el espacio cultural fue clausurado.” |
| `TEMPORAL_PAUSED` | Clausura temporal del lugar (`TEMPORAL_CLOSED_DOWN`) para eventos del día | Email de cancelación/posposición con motivo “El evento fue pospuesto temporalmente por la clausura del espacio cultural.” |
| `ACTIVE` | Reactivación del lugar | Email de reactivación (tipo `activation`) si se notifica al usuario. |

> Los cambios en eventos se propagan a través del módulo CDC (`src/cdc`) y ejecutan `eventRepository.updateManyByCulturalPlace`. Los mensajes de email son gestionados por `EventNotificationService`.

## Ejemplos cURL

```bash
# Cancelar un centro puntual con clausura definitiva
curl -X POST https://<host>/cultural-places/cancel-by-location \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <JWT>' \
  -d '{
        "latitude": -34.6037,
        "longitude": -58.3816,
        "status": "CLOSED_DOWN"
      }'

# Clausura temporal masiva en 500 metros
curl -X POST https://<host>/cultural-places/cancel-by-range \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <JWT>' \
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
3. MongoDB emite el cambio, el listener CDC (`CulturalPlaceChangeListenerService`) consume el mensaje.
4. Dependiendo del nuevo estado:
   - `CulturalPlaceClausureHandler` pausa todos los eventos.
   - `CulturalPlaceTemporalClausureHandler` pausa solo los eventos del día.
   - `CulturalPlaceActivationHandler` restablece los eventos.
5. `EventNotificationService` envía los emails correspondientes según el `status` del evento.

Este README debería ayudarte a identificar rápidamente qué endpoint usar y qué efecto tendrá sobre los centros culturales y sus eventos asociados.


