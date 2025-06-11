# Frontend Prompt for ChillFishing Raffle Website

## Project Goal
Develop the frontend interface for a fishing-themed raffle website. This interface will provide both an administrator panel for managing the activity and a participant view for engaging in the raffle.

## Tech Stack
- **React**: JavaScript library for building user interfaces.
- **Axios**: Promise-based HTTP client for making API requests to the backend. (Avoid complex state management libraries like SWR or Redux due to simple API endpoints).
- **Socket.IO Client**: For real-time communication with the backend to display raffle results.

## Features

### Admin Interface
1.  **Login Page**:
    *   A simple form to input the `SECRET_IDENTIFY_TEXT` for initial validation.
    *   Upon successful validation, store the `SECRET_IDENTIFY_TEXT` locally (e.g., in `localStorage` or a React context) to be used as an API key for subsequent requests.
    *   Redirect to the admin dashboard.
2.  **Admin Dashboard**:
    *   **Prize Management Section**:
        *   Display a list of all prizes with their name, total quantity, remaining quantity, and probability.
        *   Forms/modals to add new prizes, edit existing prizes, and delete prizes.
        *   Input validation for prize details (e.g., quantity must be positive, probability between 0 and 1).
    *   **Consolation Message Management Section**:
        *   Display a list of all "Thank you for participating" messages.
        *   Forms/modals to add new messages, edit existing messages, and delete messages.
    *   **Activity Settings Section**:
        *   Toggle switch/checkbox to set the activity as "public" or "private".
        *   If private, a section to generate new tokens (with input for count). Each generated token is for a single raffle attempt.
        *   Display a list of all existing tokens, indicating whether each token has been used.
        *   Note: For unlimited raffle attempts, the activity must be set to public (non-token based participation).
3.  **API Key Handling**:
    *   All admin API requests (except initial login) must include the stored `SECRET_IDENTIFY_TEXT` in the request headers (e.g., `X-Secret-Identify-Text`) or body.
4.  **Error and Success Notifications**:
    *   Provide clear feedback to the administrator for all operations (e.g., "Prize added successfully", "Invalid secret").

### Participant Interface
1.  **Entry Page**:
    *   If the activity is private: A form to input a raffle token. Each token allows for one raffle attempt.
    *   If the activity is public: A button or direct link to enter the activity, allowing for unlimited raffle attempts.
    *   Upon successful entry, redirect to the raffle page.
2.  **Raffle Page**:
    *   A prominent "Draw" or "Raffle" button to initiate the draw.
    *   **Raffle State Display**: The "Draw" button should be enabled only when the raffle is unlocked by the backend. Display a message (e.g., "Please wait for the next draw") when the raffle is locked.
    *   Display the raffle result clearly after each draw (e.g., "Congratulations! You won a Fish!" or "Better luck next time!").
    *   Real-time updates for raffle results (e.g., showing what others have won, if applicable, or just the current user's result).
    *   Consider a simple animation for the raffle draw.
3.  **User Feedback**:
    *   Informative messages for invalid tokens, activity status, etc.

### Projection View Interface
1.  **Dedicated Page**: A separate, full-screen page designed for display on a projection screen.
2.  **Real-time Result Display**:
    *   Listen for `displayProjectionResult` Socket.IO events from the backend.
    *   Display the raffle result (prize or consolation message) prominently, possibly with a larger animation.
    *   Include the participant ID if provided by the backend.
3.  **"Next Raffle" Control**:
    *   A clear "Next Raffle" button (or similar control) that, when clicked, sends a `nextRaffle` Socket.IO event to the backend. This event must include the `SECRET_IDENTIFY_TEXT` for authentication.
    *   This button should only be active when a result is being displayed and the raffle is locked.
    *   **Authentication**: The projection view should have an initial login/validation step for `SECRET_IDENTIFY_TEXT`. Upon successful validation, the `SECRET_IDENTIFY_TEXT` should be stored locally (e.g., in `localStorage` or a React context) and automatically included in subsequent `nextRaffle` Socket.IO events, similar to how the admin interface handles API keys. This prevents repeated manual input and exposure of the secret.

## UI/UX Considerations
-   **Responsive Design**: Ensure the website is usable and visually appealing on various devices (desktop, tablet, mobile).
-   **Intuitive Interface**: Easy navigation and clear calls to action for both administrators and participants.
-   **Visual Appeal**: A clean and engaging design, possibly incorporating fishing-themed elements.
-   **Raffle Animation (Optional but Recommended)**: A simple animation when the "Draw" button is clicked to enhance the user experience.
-   **Projection View Clarity**: The projection view should be highly readable from a distance, with large text and clear visuals.

## API Interactions
-   Use **Axios** for all HTTP requests to the backend API endpoints (e.g., `/api/admin/*`, `/api/participant/*`).
-   Configure Axios to include the `SECRET_IDENTIFY_TEXT` in headers for admin requests.
-   Use **Socket.IO Client** to connect to the backend:
    -   **Participant Interface**: Listen for `raffleResult`, `raffleLocked`, and `raffleUnlocked` events.
    -   **Projection View**: Listen for `displayProjectionResult` and emit `nextRaffle` events, including the `SECRET_IDENTIFY_TEXT` in the emitted data for authentication.

## Coding Style and Best Practices
-   **Early Return**: Prefer early returns to reduce nesting and improve readability.
-   **English Comments**: All code comments should be written in English.
-   **Component-Based Structure**: Organize the React application into reusable components.
-   **State Management**: Use React's built-in state management (useState, useContext) for simplicity.
-   **Error Handling**: Gracefully handle API errors and display user-friendly messages.
-   **Input Validation**: Implement client-side validation for forms where appropriate.
