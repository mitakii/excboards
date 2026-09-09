using Application.Boards;
using Application.Mappers;
using Application.Tags;
using Domain.Interfaces;
using excboards_api.Contracts.Boards;
using excboards_api.Contracts.Tag;
using excboards_api.Extensions;
using excboards_api.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace excboards_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TagController(TagService tagService): ControllerBase
{ }