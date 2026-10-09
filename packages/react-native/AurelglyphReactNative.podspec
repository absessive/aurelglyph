require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |spec|
  spec.name = 'AurelglyphReactNative'
  spec.version = package['version']
  spec.summary = package['description']
  spec.homepage = package['homepage']
  spec.license = { :type => 'MIT', :file => 'LICENSE.md' }
  spec.author = 'Ajit Chakrapani'
  spec.source = { :git => 'https://github.com/absessive/aurelglyph.git', :tag => "v#{spec.version}" }
  spec.platform = :ios, '15.1'
  spec.source_files = 'ios/**/*.{h,m,mm}', 'packages/react-native/ios/**/*.{h,m,mm}'
  spec.dependency 'React-Core'
  spec.dependency 'React-RCTText'
end
