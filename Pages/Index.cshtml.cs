using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.SpaServices.Prerendering;
using Newtonsoft.Json;

namespace dotnet_cra_ssr.Pages
{
    public class IndexModel : PageModel
    {
        public string Result { get; set; }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public async Task OnGet([FromServices] ISpaPrerenderer prerenderer)
        {
            var initialState = JsonConvert.SerializeObject(new { counter = new { count = 99 } });
            var prerenderResult = await prerenderer.RenderToString("./ClientApp/server/bootstrap", customDataParameter: initialState);

            Result = prerenderResult.Html;
        }
    }
}
