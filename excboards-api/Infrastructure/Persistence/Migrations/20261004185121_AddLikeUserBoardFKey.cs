using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLikeUserBoardFKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BoardLikes_UserBoards_UserBoardId",
                table: "BoardLikes");

            migrationBuilder.DropIndex(
                name: "IX_BoardLikes_UserBoardId",
                table: "BoardLikes");

            migrationBuilder.DropColumn(
                name: "UserBoardId",
                table: "BoardLikes");

            migrationBuilder.CreateIndex(
                name: "IX_BoardLikes_BoardId",
                table: "BoardLikes",
                column: "BoardId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardBookmarks_BoardId",
                table: "BoardBookmarks",
                column: "BoardId");

            migrationBuilder.AddForeignKey(
                name: "FK_BoardBookmarks_UserBoards_BoardId",
                table: "BoardBookmarks",
                column: "BoardId",
                principalTable: "UserBoards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BoardLikes_UserBoards_BoardId",
                table: "BoardLikes",
                column: "BoardId",
                principalTable: "UserBoards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BoardBookmarks_UserBoards_BoardId",
                table: "BoardBookmarks");

            migrationBuilder.DropForeignKey(
                name: "FK_BoardLikes_UserBoards_BoardId",
                table: "BoardLikes");

            migrationBuilder.DropIndex(
                name: "IX_BoardLikes_BoardId",
                table: "BoardLikes");

            migrationBuilder.DropIndex(
                name: "IX_BoardBookmarks_BoardId",
                table: "BoardBookmarks");

            migrationBuilder.AddColumn<Guid>(
                name: "UserBoardId",
                table: "BoardLikes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BoardLikes_UserBoardId",
                table: "BoardLikes",
                column: "UserBoardId");

            migrationBuilder.AddForeignKey(
                name: "FK_BoardLikes_UserBoards_UserBoardId",
                table: "BoardLikes",
                column: "UserBoardId",
                principalTable: "UserBoards",
                principalColumn: "Id");
        }
    }
}
