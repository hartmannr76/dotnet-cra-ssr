using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices.Prerendering;
using Newtonsoft.Json;

namespace dotnet_cra_ssr.Controllers
{
    public class HomeController : Controller
    {
        [Route("/"), Route("/fetchdata"), Route("/counter")]
        public async Task<IActionResult> Index([FromServices] ISpaPrerenderer prerenderer)
        {
            var initialState = JsonConvert.SerializeObject(new { counter = new { count = 99 } });
            var prerenderResult = await prerenderer.RenderToString("./ClientApp/server/bootstrap", customDataParameter: initialState);

            return Content(prerenderResult.Html, "text/html");
        }
    }
}
