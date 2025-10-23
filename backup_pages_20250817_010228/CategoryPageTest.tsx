import React from 'react';
import { useParams } from 'react-router-dom';

const CategoryPageTest: React.FC = () => {
  const { category } = useParams<{ category: string }>();

  return (
    <div style={{ padding: '20px', minHeight: '400px', backgroundColor: 'white', margin: '20px', borderRadius: '8px' }}>
      <h1 style={{ color: 'green', fontSize: '24px' }}>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â½Ãƒâ€šÃ‚Â¯ TEST CATÃƒÆ’Ã†â€™Ã¢Ã¢â€šÂ¬Ã‚Â°GORIE : {category}</h1>
      <p style={{ fontSize: '16px', color: '#666' }}>Si tu vois ce texte, la route fonctionne parfaitement !</p>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h2>Ã¢Ãƒâ€¦Ã¢â‚¬Å“Ã¢Ã¢â€šÂ¬Ã‚Â¦ SuccÃ¨s !</h2>
        <p>La navigation catÃ©gories est maintenant opÃ©rationnelle.</p>
      </div>
    </div>
  );
};

export default CategoryPageTest;

