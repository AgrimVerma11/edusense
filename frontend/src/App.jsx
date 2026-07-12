import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Spinner from './components/ui/Spinner';

// Split each route into its own chunk. The charting libraries only load when a
// student actually reaches the results or insights pages, so the landing page
// stays light.
const Home = lazy(() => import('./pages/Home'));
const Assessment = lazy(() => import('./pages/Assessment'));
const Results = lazy(() => import('./pages/Results'));
const Insights = lazy(() => import('./pages/Insights'));
const About = lazy(() => import('./pages/About'));
const Name = lazy(() => import('./pages/Name'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path="assessment"
          element={
            <Suspense fallback={<PageLoader />}>
              <Assessment />
            </Suspense>
          }
        />
        <Route
          path="results"
          element={
            <Suspense fallback={<PageLoader />}>
              <Results />
            </Suspense>
          }
        />
        <Route
          path="insights"
          element={
            <Suspense fallback={<PageLoader />}>
              <Insights />
            </Suspense>
          }
        />
        <Route
          path="about"
          element={
            <Suspense fallback={<PageLoader />}>
              <About />
            </Suspense>
          }
        />
        <Route
          path="name"
          element={
            <Suspense fallback={<PageLoader />}>
              <Name />
            </Suspense>
          }
        />
        <Route
          path="privacy"
          element={
            <Suspense fallback={<PageLoader />}>
              <Privacy />
            </Suspense>
          }
        />
        <Route
          path="terms"
          element={
            <Suspense fallback={<PageLoader />}>
              <Terms />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
