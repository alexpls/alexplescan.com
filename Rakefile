require 'html-proofer'

task :test do
  sh "bundle exec jekyll build"
  options = { assume_extension: true, url_swap: { /https:\/\/alexplescan.com/ => '' } }
  HTMLProofer.check_directory('./_site', options).run
end

task :dev do
  sh 'bundle exec jekyll serve --config "_config.yml,_config_dev.yml"'
end
