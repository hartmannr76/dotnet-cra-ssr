import path from 'path'
import fs from 'fs'

import React from 'react'
import { Provider } from 'react-redux'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { createServerRenderer } from 'aspnet-prerendering'

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
            const store = configureStore(null, JSON.parse(params.data))
            const markup = renderToString(
                <Provider store={store}>
                    <StaticRouter
                        location={params.location.path}
                        context={context}>
                        <App />
                    </StaticRouter>
                </Provider>
            )

            if (context.url) {
                // Somewhere a `<Redirect>` was rendered
                res({ redirectUrl: context.url });
                return;
            } else {
                // we're good, send the response
                const RenderedApp = htmlData
                    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
                    .replace('initialReduxState = {}', `initialReduxState=${JSON.stringify(store.getState())}`)
                    .replace(/\%PUBLIC_URL\%/g, '')
                    .replace('</body>', '<script type="text/javascript" src="/static/js/bundle.js"></script>\n</body>')
                res({
                    html: RenderedApp,
                    globals: { initialReduxState: store.getState() }
                });
            }
        })
    });
});