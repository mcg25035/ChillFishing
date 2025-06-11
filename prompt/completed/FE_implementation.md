# Frontend Implementation Details for 悠閒釣魚抽獎 Website

This document outlines the implementation details for the frontend of the 悠閒釣魚抽獎 Website, developed using React, Axios, and Socket.IO Client.

## Project Structure

The frontend application is located in the `FE/` directory. Key directories and files include:

-   `FE/src/`: Contains the main application source code.
    -   `FE/src/App.js`: Main application component, handles routing and context provision.
    -   `FE/src/App.css`: Global CSS styles for the application.
    -   `FE/src/index.js`: Entry point for the React application.
    -   `FE/src/context/AuthContext.js`: React Context for managing `SECRET_IDENTIFY_TEXT` (admin/projection authentication).
    -   `FE/src/pages/`: Contains page-level components.
        -   `FE/src/pages/AdminLoginPage.js`: Administrator login interface.
        -   `FE/src/pages/AdminDashboard.js`: Administrator dashboard for managing prizes, consolation messages, and activity settings.
        -   `FE/src/pages/ParticipantEntryPage.js`: Participant entry point (token-based or public).
        -   `FE/src/pages/RafflePage.js`: Participant raffle drawing interface.
        -   `FE/src/pages/ProjectionViewPage.js`: Dedicated page for displaying raffle results on a projection screen.
    -   `FE/src/components/`: Contains reusable UI components.
        -   `FE/src/components/PrizeForm.js`: Form for adding and editing prize details.
        -   `FE/src/components/ConsolationMessageForm.js`: Form for adding and editing consolation messages.
    -   `FE/src/utils/`: Contains utility functions and API configurations.
        -   `FE/src/utils/api.js`: Axios instance configured with base URL and request interceptor for `X-Secret-Identify-Text` header.
        -   `FE/src/utils/socket.js`: Socket.IO client instance for real-time communication.

## Implemented Features

### Admin Interface

1.  **Login Page (`AdminLoginPage.js`)**:
    *   A form to input `SECRET_IDENTIFY_TEXT`.
    *   Upon successful validation (via `/admin/login` API), the `SECRET_IDENTIFY_TEXT` is stored in `localStorage` and `AuthContext`.
    *   Redirects to the admin dashboard.
2.  **Admin Dashboard (`AdminDashboard.js`)**:
    *   **Prize Management**: Displays a table of prizes. Provides modals (`PrizeForm.js`) for adding new prizes, editing existing ones, and buttons for deleting prizes. All operations interact with `/admin/prizes` API endpoints.
    *   **Consolation Message Management**: Displays a list of messages. Provides modals (`ConsolationMessageForm.js`) for adding new messages, editing existing ones, and buttons for deleting messages. All operations interact with `/admin/consolation-messages` API endpoints.
    *   **Activity Settings**:
        *   Toggle switch to set activity as "public" or "private" (interacts with `/admin/activity-status` API).
        *   If private, a section to generate new tokens (input for count, interacts with `/admin/generate-tokens` API).
        *   Displays a list of all existing tokens, indicating usage status (fetches from `/admin/tokens` API).
    *   **API Key Handling**: `api.js` automatically includes `X-Secret-Identify-Text` header for all `/admin` API requests after successful login.
    *   **Notifications**: `showNotification` function provides clear success/error feedback.

### Participant Interface

1.  **Entry Page (`ParticipantEntryPage.js`)**:
    *   Dynamically displays a token input form if the activity is private, or a direct "Enter Raffle" button if public (fetches status from `/participant/activity-status` API).
    *   Handles token submission (for private) or direct entry (for public) via `/participant/enter-private` or `/participant/enter-public` API endpoints.
    *   Redirects to the raffle page upon successful entry.
2.  **Raffle Page (`RafflePage.js`)**:
    *   Displays a "Draw!" button, enabled only when the raffle is unlocked by the backend (listens to `raffleUnlocked` Socket.IO event).
    *   Displays "Please wait for the next draw" when locked (listens to `raffleLocked` Socket.IO event).
    *   Initiates draw via `/participant/draw` API.
    *   Displays raffle results clearly after each draw (listens to `raffleResult` Socket.IO event).
    *   Connects and disconnects Socket.IO client on component mount/unmount.

### Projection View Interface

1.  **Dedicated Page (`ProjectionViewPage.js`)**:
    *   Initial login/validation step for `SECRET_IDENTIFY_TEXT` (uses `/admin/login` API for validation and `AuthContext` for storage).
    *   Listens for `displayProjectionResult` Socket.IO events from the backend to display results (prize or consolation message, including participant ID).
    *   Includes a "Next Raffle" button that emits a `nextRaffle` Socket.IO event, including the `SECRET_IDENTIFY_TEXT` for authentication.
    *   Clears the displayed result when "Next Raffle" is clicked.

## UI/UX Considerations

-   **Responsive Design**: Basic CSS is provided in `App.css` to ensure a reasonable layout on different screen sizes.
-   **Intuitive Interface**: Clear navigation links in the header. Forms and tables are structured for readability.
-   **Visual Appeal**: Simple, clean design with distinct sections and clear feedback messages.
-   **Raffle Animation**: A basic CSS animation (`fadeInScale`) is included for the projection view result display.
-   **Projection View Clarity**: Large text and high-contrast colors are used for the projection view to ensure readability from a distance.

## API Interactions

-   **Axios**: Used for all HTTP requests. Configured with a base URL and an interceptor to automatically add the `X-Secret-Identify-Text` header for admin-related endpoints.
-   **Socket.IO Client**: Used for real-time communication.
    -   **Participant Interface**: Listens for `raffleLocked`, `raffleUnlocked`, and `raffleResult` events.
    -   **Projection View**: Listens for `displayProjectionResult` and emits `nextRaffle` events with authentication.

## Coding Style and Best Practices

-   **Early Return**: Implemented in various functions to improve readability.
-   **English Comments**: All code comments are written in English.
-   **Component-Based Structure**: Application is organized into `pages` and `components` for reusability and maintainability.
-   **State Management**: Utilizes React's `useState` and `useContext` for state management.
-   **Error Handling**: `try-catch` blocks are used for API calls, and user-friendly error messages are displayed.
-   **Input Validation**: Client-side validation is implemented in forms (e.g., `PrizeForm`, `ConsolationMessageForm`, `ParticipantEntryPage`).
