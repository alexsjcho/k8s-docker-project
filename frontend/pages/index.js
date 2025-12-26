import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [count, setCount] = useState(null);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [isLoading, setIsLoading] = useState(false);

  // Get API base URL from environment or use relative path
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

  const setStatusMessage = (message, type = 'info') => {
    setStatus({ message, type });
  };

  const fetchCount = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiBaseUrl}/count`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setCount(data.count);
      setStatusMessage('Counter loaded successfully', 'success');
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`, 'error');
      setCount(null);
    } finally {
      setIsLoading(false);
    }
  };

  const increment = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Incrementing...', 'info');
      const response = await fetch(`${apiBaseUrl}/inc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setCount(data.count);
      setStatusMessage('Counter incremented!', 'success');
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <title>Mini Store - Counter</title>
        <meta name="description" content="Mini Store Counter Application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="container">
        <h1>🛒 Mini Store</h1>
        <div className={`count-display ${isLoading ? 'loading' : ''}`}>
          {count !== null ? count : '-'}
        </div>
        <button
          id="incrementBtn"
          onClick={increment}
          disabled={isLoading}
        >
          Increment Counter
        </button>
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      </div>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container > * {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        h1 {
          color: #333;
          margin-bottom: 30px;
          font-size: 2.5em;
        }
        .count-display {
          font-size: 4em;
          font-weight: bold;
          color: #667eea;
          margin: 30px 0;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .count-display.loading {
          opacity: 0.6;
        }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 15px 40px;
          font-size: 1.2em;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 600;
        }
        button:hover:not(:disabled) {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }
        .status {
          margin-top: 20px;
          padding: 10px;
          border-radius: 6px;
          min-height: 40px;
          font-size: 0.9em;
        }
        .status.error {
          background: #fee;
          color: #c33;
        }
        .status.success {
          background: #efe;
          color: #3c3;
        }
        .status.info {
          background: #eef;
          color: #33c;
        }
      `}</style>
    </>
  );
}

