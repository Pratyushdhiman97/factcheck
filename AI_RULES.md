# VeriFact AI Rules & Tech Stack

## Tech Stack
*   **Frontend**: React 18 with Vite for fast development and bundling.
*   **Backend**: Node.js with Express for the API and verification logic.
*   **Styling**: Tailwind CSS for utility-first styling and Shadcn/UI for accessible components.
*   **Icons**: Lucide React for a consistent and clean icon set.
*   **AI Integration**: Google Gemini (1.5 Flash) for claim analysis and verdict generation.
*   **Data Sources**: NewsAPI and GNews for real-time news retrieval and cross-referencing.
*   **Scraping**: Cheerio and Axios for extracting content from news articles.
*   **Deployment**: Configured for Vercel with a custom `vercel.json`.

## Library Usage Rules
*   **Icons**: Always use `lucide-react`. Do not import raw SVGs or use other icon libraries.
*   **Components**: Prioritize `shadcn/ui` components. If a component doesn't exist there, build it using Tailwind primitives.
*   **Styling**: Use Tailwind CSS classes for all layout, spacing, and colors. Avoid writing custom CSS in `.css` files unless it's for complex animations.
*   **State Management**: Use React's built-in `useState` and `useContext` for state. Avoid adding heavy libraries like Redux unless the app complexity scales significantly.
*   **API Calls**: Use the native `fetch` API or `axios` for frontend-to-backend communication.
*   **Backend**: Keep logic modular. Scoring algorithms should live in `backend/scoring/` and external services in `backend/services/`.

## Coding Standards
*   **Responsiveness**: All UI components must be mobile-first and fully responsive.
*   **Error Handling**: Do not suppress errors. Let them bubble up or display them via Toasts/Alerts to ensure the user (and AI) can debug issues.
*   **File Structure**: Keep components in `src/components/` and pages in `src/pages/`.