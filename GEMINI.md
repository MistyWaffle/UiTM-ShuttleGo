## Project Overview

This project is a single-page web application prototype for a shuttle tracking service called "UiTM ShuttleGo". It is implemented in a single `index.html` file that contains the HTML structure, CSS styling, and JavaScript logic.

The application simulates the following features:
- **Live Shuttle Tracking:** A map view showing the real-time location of a shuttle on a predefined route.
- **Estimated Time of Arrival (ETA):** Displays the estimated arrival times for different stops.
- **Digital Wallet:** A simple wallet system that allows users to pay for rides using a QR code and top up their balance.
- **Schedule and Announcements:** A view to check the shuttle schedule and receive announcements from administrators.
- **User Profile and Settings:** A profile section with options for settings like dark mode.
- **Admin Controls:** A hidden admin panel to simulate real-world scenarios like traffic jams and to post announcements.

The application is designed to be a mobile-first experience, with a clean and modern user interface that includes both light and dark themes.

## Building and Running

This is a static web application with no build process. To run the application, simply open the `index.html` file in a web browser.

## Development Conventions

- **Single File Structure:** All code (HTML, CSS, JavaScript) is contained within the `index.html` file.
- **JavaScript:** The application logic is encapsulated within a single global `app` object, following a modular pattern.
- **CSS:** The project uses modern CSS features like variables for theming, flexbox, and grid for layout. It supports both light and dark modes based on user preference.
- **State Management:** The application state is managed within the `app` object. Some state (balance and theme) is persisted across sessions using the browser's `localStorage`.
- **Simulation:** The bus movement and ETA calculations are simulated using `setInterval` for a dynamic experience.
