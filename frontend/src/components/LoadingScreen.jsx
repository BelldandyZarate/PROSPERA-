import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="spinner">
                    <div className="spinner-circle"></div>
                    <div className="spinner-circle"></div>
                    <div className="spinner-circle"></div>
                </div>
                <h2>Restaurando sesión...</h2>
                <p>Por favor espera un momento</p>
            </div>
        </div>
    );
};

export default LoadingScreen;