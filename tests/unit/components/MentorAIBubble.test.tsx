import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MentorAIBubble from '../../../src/components/MentorAIBubble';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Send: () => <div data-testid="icon-send" />,
  Zap: () => <div data-testid="icon-zap" />,
  X: () => <div data-testid="icon-x" />,
  Minus: () => <div data-testid="icon-minus" />,
  MessageSquare: () => <div data-testid="icon-messagesquare" />,
}));

describe('MentorAIBubble', () => {
  it('renders as closed initially and opens on click', () => {
    render(<MentorAIBubble />);
    
    // Initial state: a floating button at the bottom right
    const openButton = screen.getByRole('button');
    expect(openButton).toBeInTheDocument();
    
    // Open the bubble
    fireEvent.click(openButton);
    expect(screen.getByText('Mentor AI')).toBeInTheDocument();
    
    // Ensure input is rendered
    expect(screen.getByPlaceholderText('Analyze ticker or pattern...')).toBeInTheDocument();
  });

  it('can be minimized', () => {
    render(<MentorAIBubble />);
    
    // Open
    fireEvent.click(screen.getByRole('button'));
    
    // Find minimize button (Minus icon)
    // We can find it by looking for the button containing the minus icon
    const minimizeButton = screen.getByTestId('icon-minus').closest('button');
    expect(minimizeButton).toBeDefined();
    
    fireEvent.click(minimizeButton!);
    
    // After minimizing, it should show 'Active Link' text on a smaller button
    expect(screen.getByText('Active Link')).toBeInTheDocument();
  });
});
