import React, { useState, useEffect, useRef } from 'react';

const GlitchText = ({
    text,
    className = "",
    speed = 50,
    stagger = 0.05,
    random = true, // If true, randomly changes text content from a preset or random chars
    interval = 3000 // Interval for random text changes
}) => {
    const [display, setDisplay] = useState(text);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&?!";

    useEffect(() => {
        let iteration = 0;
        let timer = null;

        const animate = () => {
            timer = setInterval(() => {
                setDisplay(prev =>
                    text.split("")
                        .map((letter, index) => {
                            if (index < iteration) {
                                return text[index];
                            }
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join("")
                );

                if (iteration >= text.length) {
                    clearInterval(timer);
                }

                iteration += 1 / 3; // Slow down the reveal
            }, speed);
        };

        animate();

        return () => clearInterval(timer);
    }, [text, speed]);

    return (
        <span className={`font-mono ${className}`}>
            {display}
        </span>
    );
};

export const RandomGlitchValues = ({ count = 5, className = "" }) => {
    const [values, setValues] = useState([]);

    const generateHex = () => '0x' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');

    useEffect(() => {
        // Initialize items
        const initialItems = Array.from({ length: count }).map(() => ({
            id: Math.random(),
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            text: generateHex(),
            opacity: 0
        }));
        setValues(initialItems);

        const interval = setInterval(() => {
            setValues(prev => prev.map(item => {
                const shouldAppear = Math.random() > 0.6; // 40% chance to be visible

                if (shouldAppear) {
                    // Logic: Appear -> Stop moving
                    return {
                        ...item,
                        opacity: Math.random() * 0.5 + 0.2, // Visible (0.2 - 0.7)
                        text: generateHex() // Randomize text when appearing
                        // keep existing top/left to "stop"
                    };
                } else {
                    // Logic: Transparent -> Keep moving
                    return {
                        ...item,
                        opacity: 0,
                        top: Math.random() * 100 + '%', // Move to new random pos
                        left: Math.random() * 100 + '%',
                        text: generateHex()
                    };
                }
            }));
        }, 1000); // 1 sec delay as requested

        return () => clearInterval(interval);
    }, [count]);

    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
            {values.map(v => (
                <div
                    key={v.id}
                    className="absolute text-[8px] font-mono text-tip-cyan/40 ease-in-out"
                    style={{
                        top: v.top,
                        left: v.left,
                        opacity: v.opacity,
                        // Logic: Disappear (1s) -> THEN Move (instant). 
                        // We use a delay on top/left equal to the opacity duration.
                        transition: 'opacity 1s ease-in-out, top 0s linear 1s, left 0s linear 1s'
                    }}
                >
                    {v.text}
                </div>
            ))}
        </div>
    );
};

export default GlitchText;
