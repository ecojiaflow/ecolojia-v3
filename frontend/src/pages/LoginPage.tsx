import React from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8'>
        <h2 className='text-2xl font-bold text-center mb-6'>Connexion</h2>
        <form className='space-y-4'>
          <input type='email' placeholder='Email' className='w-full px-4 py-2 border rounded-lg' />
          <input type='password' placeholder='Mot de passe' className='w-full px-4 py-2 border rounded-lg' />
          <button type='submit' className='w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700'>
            Se connecter
          </button>
        </form>
        <p className='text-center mt-4'>
          Pas encore de compte? <Link to='/register' className='text-green-600'>S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}
