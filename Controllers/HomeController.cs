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
        [Route("/")]
        [Route("/fetchdata")]
        [Route("/counter")]
        public async Task<IActionResult> Index([FromServices] ISpaPrerenderer prerenderer)
        {
            var initialState = JsonConvert.SerializeObject(new { counter = new { count = 99 } });
            var prerenderResult = await prerenderer.RenderToString("./ClientApp/server/bootstrap", exportName: "prerenderer", customDataParameter: initialState);

            if (prerenderResult.StatusCode != null && prerenderResult.StatusCode != 200)
            {
                return RedirectToPage("/Error");
            }

            return Content(prerenderResult.Html, "text/html");
        }
    }
}
