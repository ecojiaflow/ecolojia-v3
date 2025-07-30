import React from 'react';
import { Trans } from 'react-i18next';

interface HighlightProps {
  children: React.ReactNode;
}

const Highlight: React.FC<HighlightProps> = ({ children }) => (
  <span className="text-eco-leaf">{children}</span>
);

interface TranslatedContentProps {
  i18nKey: string;
  values?: Record<string, unknown>;
}

export const TranslatedContent: React.FC<TranslatedContentProps> = ({ i18nKey, values }) => {
  const components = {
    highlight: <Highlight />,
    // Add more custom components as needed
  };

  return (
    <Trans
      i18nKey={i18nKey}
      values={values}
      components={components}
    />
  );
};