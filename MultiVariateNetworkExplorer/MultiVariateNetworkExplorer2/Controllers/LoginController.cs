using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using MultiVariateNetworkExplorer2.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Linq;

namespace MultiVariateNetworkExplorer2.Controllers
{
    public class LoginController : Controller
    {
        private readonly IWebHostEnvironment _webHostEnvironment;
        const int keySize = 64;
        const int hashIterations = 250000;
        HashAlgorithmName hashAlgorithm = HashAlgorithmName.SHA512;

        public LoginController(IWebHostEnvironment webHostEnvironment)
        {
            _webHostEnvironment = webHostEnvironment;
        }

        public IActionResult Index()
        {
            return View("Login");
        }

        public IActionResult Login(string returnUrl = "~/Home/Graph")
        {   
            LoginModel loginModel = new LoginModel();
            loginModel.ReturnUrl = returnUrl;
            return View(loginModel);
        }

        [HttpPost]
        public async Task<IActionResult> Login([Bind]LoginModel loginModel)
        {
            if (ModelState.IsValid)
            {
                if (validateLoginInfo(loginModel))
                {
                    var claims = new List<Claim>
                    {
                    new Claim(ClaimTypes.Name, loginModel.UserName)
                    };

                    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                    var principal = new ClaimsPrincipal(identity);

                    await HttpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        principal,
                        new AuthenticationProperties
                        {
                            IsPersistent = true,
                            ExpiresUtc = DateTimeOffset.UtcNow.AddYears(100)
                        }
                        );
                    
                    return RedirectToAction("Graph", "Home");
                    
                }
            }

            ViewBag.Message = "Invalid Credentials. Please check your Username and Password.";
            return View(loginModel);
        }

        public async Task<IActionResult> LogOut()
        {
            //SignOutAsync is Extension method for SignOut    
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            //Redirect to home page    
            return RedirectToAction("Index", "Login");
        }

        private string HashPassword(string password, out byte[] salt)
        {
            salt = RandomNumberGenerator.GetBytes(keySize);

            var hash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                hashIterations,
                hashAlgorithm,
                keySize);

            return Convert.ToHexString(hash);

        }

        private bool validateLoginInfo(LoginModel loginModel)
        {
            if (loginModel == null)
            {
                return false;
            }
            string userDbPath = Path.Combine(_webHostEnvironment.WebRootPath, "db", "xml", "users_db.xml");
            XDocument userDoc = XDocument.Load(userDbPath);

            var user = userDoc
                .Root
                .Descendants("user")
                .SingleOrDefault(u =>
                u.Attribute("name").Value == loginModel.UserName);

            if (user == null)
            {
                return false;
            }


            byte[] salt = Convert.FromHexString(user.Attribute("salt").Value);
            byte[] inputHash = Rfc2898DeriveBytes.Pbkdf2(loginModel.Password, salt, hashIterations, hashAlgorithm, keySize);
            byte[] savedPassword = Convert.FromHexString(user.Attribute("hash").Value);

            return CryptographicOperations.FixedTimeEquals(inputHash, savedPassword);

        }
        
    }
}
