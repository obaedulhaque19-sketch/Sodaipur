import React from 'react';
import App from '../src/App';

// Incremental Static Regeneration (ISR): Cache home page on CDN for 1 hour
export const revalidate = 3600;

export default function NextHomePage() {
  return <App />;
}
