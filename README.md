## Dotnet CRA (From template) With SSR

Most of the initial investigation has already been done and documented in this [wonderful write-up](https://medium.com/bucharestjs/upgrading-a-create-react-app-project-to-a-ssr-code-splitting-setup-9da57df2040a), however for my circumstance, I wanted to know how to do this in .NET Core instead of Node. The following steps outline how to get up and running with the template provided by Microsoft. The referenced article explains more in detail what is going on, this is just quickly outlining what to do with .NET.

To start, generate your project and restore your dependencies

    mkdir dotnet-cra-ssr
    cd dotnet-cra-ssr
    dotnet new reactredux
    cd ClientApp
    npm i

## Client Setup

While we are in the `ClientApp` area of the codebase, lets add the dependencies, files, and directory we are going to need.

    npm i aspnet-prerendering@^3.0.1 babel-register babel-preset-es2015 babel-preset-react-app ignore-styles --save
    mkdir server

Add 2 files to your `server` folder. `index.js` and `bootstrap.js`.

`index.js` should have the following content:

```js
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
```

`bootstrap.js` should have the following content:

```js
require('ignore-styles');

require('babel-register')({
    ignore: [/(node_modules)/],
    presets: ['es2015', 'react-app']
});

const prerenderer = require('./index').default;

module.exports = prerenderer
```

Now we need to make updates to some existing files from the template.

Starting with `ClientApp/src/index.js`, update `ReactDOM.render` to `ReactDOM.hydrate`.

We also need to edit `ClientApp/public/index.html` to have

```html
<!-- This should alread be here -->
<div id="root"></div>
<!-- This is new -->
<script type="text/javascript" charset="utf-8">
    window.initialReduxState = {};
</script>
```

_Note:_ If you want to render `/fetchdata` on the server, you need to update `/ClientApp/src/FetchData.js` to use `componentDidMount` instead of `componentWillMount`.

## Server Setup

Starting with the `Startup.cs` file, we will need resources to actually invoke Node commands,
so we will want to include the following

```csharp
public void ConfigureServices(IServiceCollection services)
{
    ...
    // Adding the following for SSR
    services.AddNodeServices();
    services.AddSpaPrerenderer();
}
```

I decided to add a `HomeController.cs` to my project, so I also updated the default route to be:

```csharp
routes.MapRoute(
    name: "default",
    template: "{controller=Home}/{action=Index}/{id?}");
```

Now, as mentioned above, add a `HomeController.cs` to the `/Controllers` directory, with the following code:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices.Prerendering;
using Newtonsoft.Json;

namespace dotnet_cra_ssr.Controllers
{
    public class HomeController : Controller
    {
        // add whichever routes you want to prerender
        [Route("/"), Route("/fetchdata"), Route("/counter")]
        public async Task<IActionResult> Index([FromServices] ISpaPrerenderer prerenderer)
        {
            var initialState = JsonConvert.SerializeObject(new { counter = new { count = 99 } });
            var prerenderResult = await prerenderer.RenderToString("./ClientApp/server/bootstrap", customDataParameter: initialState);

            return Content(prerenderResult.Html, "text/html");
        }
    }
}
```

# TODO

-   [ ] Update handling on client routing 404 and Redirects
