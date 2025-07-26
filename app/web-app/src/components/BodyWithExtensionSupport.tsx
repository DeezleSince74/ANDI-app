'use client';

import { useEffect } from 'react';

interface BodyWithExtensionSupportProps {
  children: React.ReactNode;
  className?: string;
}

export function BodyWithExtensionSupport({ children, className }: BodyWithExtensionSupportProps) {
  useEffect(() => {
    // This runs after hydration to handle browser extension attributes
    // that get added dynamically (like Grammarly)
    
    // Common browser extension attributes that cause hydration mismatches
    const extensionAttributes = [
      'data-new-gr-c-s-check-loaded',
      'data-gr-ext-installed', 
      'data-gr-aaa-loaded',
      'data-new-gr-c-s-loaded',
      'cz-shortcut-listen',
      'data-lastpass-icon-root',
      'data-honey-extension-installed'
    ];

    // Add these attributes client-side only to prevent hydration mismatch
    extensionAttributes.forEach(attr => {
      if (document.body.hasAttribute(attr)) {
        // Attribute is already there from extension, no action needed
        return;
      }
    });
  }, []);

  return (
    <body className={className} suppressHydrationWarning={true}>
      {children}
    </body>
  );
}