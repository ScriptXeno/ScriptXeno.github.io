#!/usr/bin/env ruby
#
# Check for changed posts

Jekyll::Hooks.register :posts, :post_init do |post|

  commit_num = `git rev-list --count HEAD "#{ post.path }"`

  if commit_num.to_i > 1
    lastmod_date = `git log -1 --pretty="%ad" --date=iso "#{ post.path }"`
    post.data['last_modified_at'] = lastmod_date
  end

end

# Tab pages (_tabs/*.md) have no `date` front matter to fall back on, so unlike
# posts, last_modified_at must always be set from git history -- otherwise
# Jekyll::Document#date defaults to the build time, and jekyll-sitemap reports
# that as <lastmod>, making every deploy look like a content change even when
# the page hasn't been touched in over a year.
Jekyll::Hooks.register :tabs, :post_init do |tab|

  lastmod_date = `git log -1 --pretty="%ad" --date=iso "#{ tab.path }"`
  tab.data['last_modified_at'] = lastmod_date unless lastmod_date.empty?

end
