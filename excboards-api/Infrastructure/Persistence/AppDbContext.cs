using Domain.Entities;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<User, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserBoard> UserBoards => Set<UserBoard>();
    public DbSet<UserProject> UserProjects => Set<UserProject>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<BoardCollaborator> BoardCollaborators => Set<BoardCollaborator>();
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RefreshToken>(rt =>
        {
            rt.HasIndex(x => x.TokenHash).IsUnique();
            rt.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserBoard>(b =>
        {
            b.HasMany(x => x.Tags)
                .WithMany();

            b.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(x => x.UserId);
            b.HasIndex(x => new { x.IsPublished, x.Updated });
            b.HasIndex(x => new { x.UserId, x.NormalizedName }).IsUnique();

            b.Property(x => x.Name).HasMaxLength(200);
            b.Property(x => x.Description).HasMaxLength(1000);
        });

        builder.Entity<UserProject>(p =>
        {
            p.HasMany(up => up.UserBoards)
                .WithMany();

            p.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            p.HasIndex(x => x.UserId);

            p.Property(x => x.Name).HasMaxLength(200);
            p.Property(x => x.Description).HasMaxLength(1000);
        });

        builder.Entity<Tag>(t =>
        {
            t.HasIndex(x => x.Name).IsUnique();
            t.Property(x => x.Name).HasMaxLength(100);
        });

        builder.Entity<BoardCollaborator>(c =>
        {
            c.HasOne(x => x.Board)
                .WithMany(b => b.Collaborators)
                .HasForeignKey(x => x.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            c.HasOne<User>()
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            c.HasIndex(x => new { x.BoardId, x.UserId }).IsUnique();
        });
    }
}
