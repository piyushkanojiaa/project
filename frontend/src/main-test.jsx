import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Minimal test component - if this doesn't work, React itself is broken
function App() {
    return (
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial' }}>
            <h1 style={{ color: 'white', fontSize: '48px' }}>✅ React is Working!</h1>
            <p style={{ color: '#ccc', fontSize: '24px' }}>If you see this, the issue was in the complex components.</p>
            <div style={{ marginTop: '30px' }}>
                <a href="/dashboard" style={{ color: '#60a5fa', fontSize: '20px' }}>Go to Dashboard</a>
            </div>
        </div>
    );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
    document.body.innerHTML = '<h1 style="color: red;">ERROR: Root element not found!</h1>';
} else {
    try {
        createRoot(rootElement).render(
            <StrictMode>
                <App />
            </StrictMode>
        );
    } catch (error) {
        console.error('React render error:', error);
        document.body.innerHTML = `<h1 style="color: red;">React Error: ${error.message}</h1>`;
    }
}
