import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import Detail from './pages/Detail/Detail';
import Mine from './pages/Mine/Mine';
import NotFound from './pages/NotFound/NotFound';
import Publish from './pages/Publish/Publish';
import Square from './pages/Square/Square';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Square />} />
        <Route path="publish" element={<Publish />} />
        <Route path="mine" element={<Mine />} />
      </Route>
      <Route path="post/:id" element={<Detail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
