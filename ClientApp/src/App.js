import React from 'react';
import { Route, Switch } from 'react-router';
import Layout from './components/Layout';
import Counter from './components/Counter';
import Loadable from 'react-loadable';

const AsyncHome = Loadable({
  loader: () => import(/* webpackChunkName: "homeChunk" */ './components/Home'),
  loading: () => <div>loading...</div>,
  modules: ['homeChunk'],
});

const AsyncForecast = Loadable({
  loader: () => import(/* webpackChunkName: "forecastChunk" */ './components/FetchData'),
  loading: () => <div>loading...</div>,
  modules: ['forecastChunk'],
});

const Status = ({ code, children }) => (
  <Route render={({ staticContext }) => {
    if (staticContext)
      staticContext.status = code
    return children
  }} />
)

const NotFound = () => (
  <Status code={404}>
    <div>
      <h1>Sorry, can’t find that.</h1>
    </div>
  </Status>
)

export default () => (
  <Layout>
    <Switch>
      <Route exact path='/' component={AsyncHome} />
      <Route path='/counter' component={Counter} />
      <Route path='/fetchdata/:startDateIndex?' component={AsyncForecast} />
      <Route component={NotFound} />
    </Switch>
  </Layout>
);
