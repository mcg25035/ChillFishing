# Backend Prompt for 悠閒釣魚抽獎 Website

## Project Goal
Implement the backend service for a fishing-themed raffle website. This service will manage raffle logic, prize distribution, participant access, and administrator controls.

## Tech Stack
- **Node.js**: Runtime environment.
- **Express**: Web application framework for building RESTful APIs.
- **Socket.IO**: For real-time communication, especially for broadcasting raffle results.
- **SQLite**: Lightweight, file-based database for storing application data.
- **Dotenv**: For managing environment variables.

## Features

### Admin Features (Requires `SECRET_IDENTIFY_TEXT` as API Key)
1.  **Prize Management**:
    *   Create, read, update, and delete prizes.
    *   Each prize has a name, total quantity, and probability.
    *   The system should track the remaining quantity of each prize.
2.  **Consolation Message Management**:
    *   Create, read, update, and delete alternative messages for "Thank you for participating" (銘謝惠顧).
3.  **Activity Management**:
    *   Toggle between "private activity" (requires token) and "public activity" (accessible via link/code).
    *   Generate unique tokens for private activities. Each token is designed for a single raffle attempt.
    *   View a list of all generated tokens and their usage status.
    *   Note: For unlimited raffle attempts, the activity must be set to public (non-token based participation).
4.  **Basic API Security**:
    *   All administrator operations must be authenticated by including the `SECRET_IDENTIFY_TEXT` (configured in `.env`) in the request headers or body as an API key.

### Participant Features
1.  **Activity Entry**:
    *   For private activities: Participants enter by submitting a valid token. Each token can only be used once for a single raffle attempt.
    *   For public activities: Participants enter via a direct link or code (no token required), allowing for unlimited raffle attempts.
2.  **Raffle Logic**:
    *   Participants can initiate a raffle draw.
    *   The system determines the prize based on predefined probabilities and remaining quantities.
    *   If a prize is won, its remaining quantity is decremented.
    *   If no prize is won (or all prizes are depleted), a "Thank you for participating" message is returned.
    *   **Raffle State Management**: The backend will maintain a global raffle state (e.g., `isRaffleLocked`). When a participant initiates a draw, the state will be locked (`isRaffleLocked = true`), preventing other participants from drawing until the state is unlocked.
3.  **Real-time Raffle Results**:
    *   Use Socket.IO to broadcast raffle results to all connected participants and the projection view in real-time.

### Projection View Features
1.  **Display Raffle Results**: Receive and display real-time raffle results from the backend.
2.  **Control Raffle Flow**: A mechanism (e.g., a button) to signal the backend to unlock the raffle state, allowing the next participant to draw.

## Database Design (SQLite)

### `prizes` table
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT NOT NULL)
- `total_quantity` (INTEGER NOT NULL)
- `remaining_quantity` (INTEGER NOT NULL) - Default to `total_quantity` on creation.
- `probability` (REAL NOT NULL) - A value between 0 and 1. Sum of all probabilities should ideally be 1 or less.

### `consolation_messages` table
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `message` (TEXT NOT NULL)

### `settings` table (Single row table)
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT 1)
- `is_public` (BOOLEAN NOT NULL) - Default to FALSE.
- `secret_identify_text` (TEXT NOT NULL) - Stored here for simplicity, but ideally should be from .env.

### `tokens` table
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `token` (TEXT UNIQUE NOT NULL)
- `is_used` (BOOLEAN NOT NULL) - Default to FALSE.

### `raffle_logs` table
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `participant_id` (TEXT NOT NULL) - A unique identifier for the participant (e.g., socket ID or session ID).
- `prize_id` (INTEGER) - NULL if "Thank you for participating".
- `consolation_message_id` (INTEGER) - NULL if a prize is won.
- `timestamp` (DATETIME DEFAULT CURRENT_TIMESTAMP)

## API Endpoints

### Admin APIs (Prefix: `/api/admin`)
- `POST /api/admin/login`
    - Request: `{ "secret_identify_text": "your_secret" }`
    - Response: `{ "success": true, "message": "Login successful" }` or `{ "success": false, "message": "Invalid secret" }`
    - Note: This endpoint is primarily for initial validation. The `secret_identify_text` should then be used as an API key for subsequent admin requests.
- `GET /api/admin/prizes`
    - Request Header/Body: `X-Secret-Identify-Text: your_secret` or `{ "secret_identify_text": "your_secret" }`
    - Response: `[ { id, name, total_quantity, remaining_quantity, probability }, ... ]`
- `POST /api/admin/prizes`
    - Request Header/Body: `X-Secret-Identify-Text: your_secret` or `{ "secret_identify_text": "your_secret" }`
    - Request: `{ "name": "New Prize", "total_quantity": 10, "probability": 0.1 }` (for new) or `{ "id": 1, "name": "Updated Prize", ... }` (for update)
    - Response: `{ "success": true, "prize": { ... } }`
- `DELETE /api/admin/prizes/:id`
    - Request Header/Body: `X-Secret-Identify-Text: your_secret` or `{ "secret_identify_text": "your_secret" }`
    - Response: `{ "success": true, "message": "Prize deleted" }`
- `GET /api/admin/consolation-messages`
    - Request Header/Body: `X-Secret-Identify-Text: your_secret` or `{ "secret_identify_text": "your_secret" }`
    - Response: `[ { id, message }, ... ]`
- `POST /api/admin/consolation-messages`
    - Request Header/Body: `X-Secret-Identify-Text: your_secret` or `{ "secret_identify_text": "your_secret" }`
    - Request: `{ "message": "New message" }` (for new) or `{ "id": 1, "message": "Updated message" }` (for update)
    - Response: `{ "success": true, "message": { ... } }`
- `DELETE /api/admin/consolation-messages/:id`
    - Request Header/Body: `X-Secret-Identify-Text: your_secret` or `{ "secret_identify_text": "your_secret" }`
    - Response: `{ "success": true, "message": "Message deleted" }`
- `POST /api/admin/settings/public`
    - Request Header/Body: `X-Secret-Identify-Text: your_secret` or `{ "secret_identify_text": "your_secret" }`
    - Request: `{ "is_public": true }`
    - Response: `{ "success": true, "message": "Activity setting updated" }`
- `POST /api/admin/tokens/generate`
    - Request Header/Body: `X-Secret-Identify-Text: your_secret` or `{ "secret_identify_text": "your_secret" }`
    - Request: `{ "count": 5 }`
    - Response: `{ "success": true, "tokens": ["token1", "token2", ...] }`
- `GET /api/admin/tokens`
    - Request Header/Body: `X-Secret-Identify-Text: your_secret` or `{ "secret_identify_text": "your_secret" }`
    - Response: `[ { id, token, is_used }, ... ]`

### Participant APIs (Prefix: `/api/participant`)
- `POST /api/participant/enter`
    - Request: `{ "token": "your_token" }` (for private) or `{}` (for public)
    - Response: `{ "success": true, "message": "Entered activity" }` or `{ "success": false, "message": "Invalid token/activity type" }`
- `POST /api/participant/raffle`
    - Request: `{ "participant_id": "unique_id_from_frontend" }`
    - Response: `{ "success": true, "result": { "type": "prize", "name": "Fish", "remaining": 5 } }` or `{ "success": true, "result": { "type": "consolation", "message": "Better luck next time!" } }`

## Socket.IO Events
- **Server to Client**:
    - `raffleResult`: Emitted to all participants after each successful raffle draw.
        - Data: `{ "type": "prize", "name": "Fish", "remaining": 5 }` or `{ "type": "consolation", "message": "Better luck next time!" }`
    - `raffleLocked`: Emitted to all participants when a raffle draw is in progress and the system is locked.
    - `raffleUnlocked`: Emitted to all participants when the raffle system is unlocked, allowing the next draw.
    - `displayProjectionResult`: Emitted specifically to the projection view with the raffle result for display.
        - Data: `{ "type": "prize", "name": "Fish", "remaining": 5, "participant_id": "..." }` or `{ "type": "consolation", "message": "Better luck next time!", "participant_id": "..." }`

- **Client to Server (from Projection View)**:
    - `nextRaffle`: Emitted by the projection view (with `SECRET_IDENTIFY_TEXT` for authentication) to signal that the current raffle display is complete and the system can unlock for the next draw.

## Environment Variables (.env)
- `PORT`: Port for the Express server (e.g., 3001).
- `SECRET_IDENTIFY_TEXT`: Secret string for admin authentication.
- `DATABASE_PATH`: Path to the SQLite database file (e.g., `./data/raffle.db`). (User specified this is fixed)

## Coding Style and Best Practices
- **Early Return**: Prefer early returns to reduce nesting and improve readability.
- **English Comments**: All code comments should be written in English.
- **Error Handling**: Implement robust error handling for API endpoints and database operations.
- **Modularity**: Organize code into logical modules (e.g., routes, controllers, services, database).
- **Validation**: Validate incoming request data.
- **Security**: Ensure basic security practices, especially for admin routes.
