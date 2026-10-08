using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetShop.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalLoginToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "Users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Local");

            migrationBuilder.AddColumn<string>(
                name: "ProviderKey",
                table: "Users",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Provider",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ProviderKey",
                table: "Users");
        }
    }
}
