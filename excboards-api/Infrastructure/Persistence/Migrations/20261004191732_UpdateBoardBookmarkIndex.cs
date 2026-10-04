using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBoardBookmarkIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BoardBookmarks_BoardId_UserId",
                table: "BoardBookmarks");

            migrationBuilder.CreateIndex(
                name: "IX_BoardBookmarks_BoardId",
                table: "BoardBookmarks",
                column: "BoardId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardBookmarks_UserId_BoardId",
                table: "BoardBookmarks",
                columns: new[] { "UserId", "BoardId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BoardBookmarks_BoardId",
                table: "BoardBookmarks");

            migrationBuilder.DropIndex(
                name: "IX_BoardBookmarks_UserId_BoardId",
                table: "BoardBookmarks");

            migrationBuilder.CreateIndex(
                name: "IX_BoardBookmarks_BoardId_UserId",
                table: "BoardBookmarks",
                columns: new[] { "BoardId", "UserId" },
                unique: true);
        }
    }
}
