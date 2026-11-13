import { RouterProvider } from "react-router";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context";
import { ThemeProvider } from "./features/theme/theme.context";
import ThemeToggle from "./features/theme/ThemeToggle";

function AppContent() {
    return (
        <>
            <ThemeToggle />
            <RouterProvider router={router} />
        </>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
