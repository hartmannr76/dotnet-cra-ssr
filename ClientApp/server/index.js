import path from 'path'
import fs from 'fs'

import React from 'react'
import { Provider } from 'react-redux'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { createServerRenderer } from 'aspnet-prerendering'
import Loadable from 'react-loadable';

import configureStore from '../src/store/configureStore'
import App from '../src/App'

export default createServerRenderer((params) => {
    return new Promise((res, rej) => {
        const filePath = path.resolve(__dirname, '..', 'public', 'index.html')

        fs.readFile(filePath, 'utf8', (err, htmlData) => {
            if (err) {
                console.error('read err', err)
                return rej('no file read')
            }
            const context = {}
            const modules = [];
            const store = configureStore(null, JSON.parse(params.data))
            const markup = renderToString(
                <Provider store={store}>
                    <StaticRouter
                        location={params.location.path}
                        context={context}>
                        <Loadable.Capture report={m => modules.push(m)}>
                            <App />
                        </Loadable.Capture>
                    </StaticRouter>
                </Provider>
            )

            if (context.url) {
                // Somewhere a `<Redirect>` was rendered
                res({ redirectUrl: context.url });
                return;
            } else if (!context.status) {
                // we're good, send the response
                const extraChunks = modules.map(x => `<script type="text/javascript" src="/static/js/${x}.chunk.js"></script>\n`);
                const RenderedApp = htmlData
                    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
                    .replace('initialReduxState = {}', `initialReduxState=${JSON.stringify(store.getState())}`)
                    .replace(/\%PUBLIC_URL\%/g, '')
                    .replace('</body>', `<script type="text/javascript" src="/static/js/bundle.js"></script>\n${extraChunks.join()}</body>`)
                res({
                    html: RenderedApp,
                    globals: { initialReduxState: store.getState() }
                });
            } else {
                res({
                    statusCode: context.status
                })
            }
        })
    });
});