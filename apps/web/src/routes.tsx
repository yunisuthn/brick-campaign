import type { RouteObject } from 'react-router';
import { HomePage } from './pages/HomePage.js';

/** Declared apart from the browser router so tests can mount them in a memory router. */
export const routes: RouteObject[] = [{ path: '/', element: <HomePage /> }];
