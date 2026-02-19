import React from 'react';
import styled from 'styled-components';

const Loader = ({ text = "LOADING" }) => {
  // Center point for z-index calculation (pyramid stacking)
  const centerIndex = Math.floor(text.length / 2);

  return (
    <StyledWrapper style={{ '--char-count': text.length }}>
      <div className="wrapper-grid">
        {text.split('').map((char, index) => {
          // Calculate mountain/pyramid z-index pattern
          // e.g. 0, 1, 2, 3, 2, 1, 0
          const zIndex = centerIndex - Math.abs(index - centerIndex);

          return (
            <div
              key={index}
              className="cube"
              style={{
                zIndex: Math.max(0, zIndex),
                animationDelay: `${index * 0.2}s`
              }}
            >
              <div className="face face-front">{char}</div>
              <div className="face face-back" />
              <div className="face face-right" />
              <div className="face face-left" />
              <div className="face face-top" />
              <div className="face face-bottom" />
            </div>
          );
        })}
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .wrapper-grid {
    --animation-duration: 2.1s;
    --cube-color: #0000;
    --highlight-color: #3e30c0ff;
    --cube-width: 48px;
    --cube-height: 48px;
    --font-size: 1.8em;

    position: relative;
    inset: 0;

    display: grid;
    /* Dynamic columns based on char count */
    grid-template-columns: repeat(var(--char-count), var(--cube-width));
    grid-template-rows: auto;
    grid-gap: 0;

    width: calc(var(--char-count) * var(--cube-width));
    height: var(--cube-height);
    perspective: 350px;

    font-family: "Poppins", sans-serif;
    font-size: var(--font-size);
    font-weight: 800;
    color: transparent;
  }

  .cube {
    position: relative;
    transform-style: preserve-3d;
    animation: translate-z var(--animation-duration) ease-in-out infinite;
  }

  .face {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--cube-width);
    height: var(--cube-height);
    background-color: var(--cube-color);
    
    animation:
      face-color var(--animation-duration) ease-in-out infinite,
      edge-glow var(--animation-duration) ease-in-out infinite;
    /* Inherit the inline animation-delay from the parent .cube */
    animation-delay: inherit; 
  }

  .face-left,
  .face-right,
  .face-back,
  .face-front {
    box-shadow:
      inset 0 0 2px 1px #0001,
      inset 0 0 12px 1px #fff1;
  }

  .face-front {
    transform: rotateY(0deg) translateZ(calc(var(--cube-width) / 2));
    /* face-front has the extra glow animation */
    animation:
      face-color var(--animation-duration) ease-in-out infinite,
      face-glow var(--animation-duration) ease-in-out infinite,
      edge-glow var(--animation-duration) ease-in-out infinite;
    animation-delay: inherit;
  }

  .face-back {
    transform: rotateY(180deg) translateZ(calc(var(--cube-width) / 2));
    opacity: 0.6;
  }
  .face-left {
    transform: rotateY(-90deg) translateZ(calc(var(--cube-width) / 2));
    opacity: 0.6;
  }
  .face-right {
    transform: rotateY(90deg) translateZ(calc(var(--cube-width) / 2));
    opacity: 0.6;
  }
  .face-top {
    height: var(--cube-width);
    transform: rotateX(90deg) translateZ(calc(var(--cube-width) / 2));
    opacity: 0.8;
  }
  .face-bottom {
    height: var(--cube-width);
    transform: rotateX(-90deg)
      translateZ(calc(var(--cube-height) - var(--cube-width) * 0.5));
    opacity: 0.8;
  }

  /* Note: nth-child blocks removed in favor of inline JS styles loop */

  @keyframes translate-z {
    0%,
    40%,
    100% {
      transform: translateZ(-2px);
    }
    30% {
      transform: translateZ(16px) translateY(-1px);
    }
  }
  @keyframes face-color {
    0%,
    50%,
    100% {
      background-color: var(--cube-color);
    }
    10% {
      background-color: var(--highlight-color);
    }
  }
  @keyframes face-glow {
    0%,
    50%,
    100% {
      color: #fff0;
      filter: none;
    }
    30% {
      color: #fff;
      filter: drop-shadow(0 14px 10px var(--highlight-color));
    }
  }
  @keyframes edge-glow {
    0%,
    40%,
    100% {
      box-shadow:
        inset 0 0 2px 1px #0001,
        inset 0 0 12px 1px #fff1;
    }
    30% {
      box-shadow: 0 0 2px 0px var(--highlight-color);
    }
  }`;

export default Loader;
