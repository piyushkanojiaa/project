import React from 'react';
import { cn } from '../../lib/utils';

interface TypewriterEffectProps {
    words: Array<{
        text: string;
        className?: string;
    }>;
    className?: string;
    cursorClassName?: string;
}

export const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
    words,
    className,
    cursorClassName,
}) => {
    const wordsArray = words.map((word) => ({
        ...word,
        text: word.text.split(''),
    }));

    const [currentWordIndex, setCurrentWordIndex] = React.useState(0);
    const [currentCharIndex, setCurrentCharIndex] = React.useState(0);

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            if (currentCharIndex < wordsArray[currentWordIndex].text.length) {
                setCurrentCharIndex(currentCharIndex + 1);
            } else if (currentWordIndex < wordsArray.length - 1) {
                setCurrentWordIndex(currentWordIndex + 1);
                setCurrentCharIndex(0);
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [currentWordIndex, currentCharIndex, wordsArray]);

    return (
        <div className={cn('flex space-x-1 my-6', className)}>
            {wordsArray.map((word, idx) => (
                <div key={`word-${idx}`} className="inline-block">
                    {idx <= currentWordIndex && (
                        <>
                            {word.text.map((char, index) => (
                                <span
                                    key={`char-${index}`}
                                    className={cn(
                                        `text-6xl md:text-7xl font-bold`,
                                        word.className,
                                        index < currentCharIndex ? 'opacity-100' : 'opacity-0'
                                    )}
                                    style={{
                                        transition: 'opacity 0.1s',
                                    }}
                                >
                                    {char}
                                </span>
                            ))}
                        </>
                    )}
                </div>
            ))}
            <span
                className={cn(
                    'inline-block w-1 h-16 md:h-20 bg-blue-400 ml-2',
                    cursorClassName,
                    currentWordIndex === wordsArray.length - 1 &&
                        currentCharIndex === wordsArray[currentWordIndex].text.length
                        ? 'animate-pulse'
                        : 'animate-none'
                )}
            />
        </div>
    );
};

// Alternative: Smooth typewriter without word-by-word
export const TypewriterEffectSmooth: React.FC<TypewriterEffectProps> = ({
    words,
    className,
}) => {
    return (
        <div className={cn('text-center', className)}>
            {words.map((word, idx) => (
                <span
                    key={`word-smooth-${idx}`}
                    className={cn(
                        'text-6xl md:text-7xl font-bold inline-block mr-3',
                        word.className,
                        'animate-fade-in'
                    )}
                    style={{
                        animationDelay: `${idx * 0.3}s`,
                        animationFillMode: 'both',
                    }}
                >
                    {word.text}
                </span>
            ))}
        </div>
    );
};

export default TypewriterEffect;
