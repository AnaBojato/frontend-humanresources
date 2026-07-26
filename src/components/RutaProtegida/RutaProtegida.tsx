import type { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { estaAutenticado } from '../../services/authService';

interface Props {
  children: JSX.Element;
}

export default function RutaProtegida({ children }: Props) {
  return estaAutenticado() ? children : <Navigate to="/login" replace />;
}