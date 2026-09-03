#!/usr/bin/env ruby
#
# jekyll-archives builds tag/category pages via Jekyll::Archives::Archive.new, which sets
# @data directly and never calls Jekyll::Page's own constructor -- so a normal
# `Jekyll::Hooks.register :pages, :post_init` hook (as used in posts-lastmod-hook.rb) never
# fires for them. `:site, :pre_render` does: it runs once, after all generators (including
# jekyll-archives and jekyll-sitemap) have populated site.pages, but before anything renders.
#
# Tag/category pages with fewer than 5 posts are near-duplicates of the post(s) they list --
# see _includes/head.html for the matching <meta name="robots" content="noindex"> on the
# HTML side. jekyll-sitemap reads page.data['sitemap'] at render time, so setting it false
# here keeps these same thin pages out of sitemap.xml too.

Jekyll::Hooks.register :site, :pre_render do |site|
  site.pages.each do |page|
    next unless %w(tag category).include?(page.data['layout'])
    next unless page.respond_to?(:posts) && page.posts.size < 5

    page.data['sitemap'] = false
  end
end
