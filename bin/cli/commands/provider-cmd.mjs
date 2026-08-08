export function registerProvider(program) {
  program
    .command("provider [subcommand]")
    .description("Manage provider connections (use 'providers' for the full interface)")
    .allowUnknownOption()
    .allowExcessArguments()
    .action(() => {
      console.log(`
  Use \`xenia providers\` for the full provider management interface:

    xenia providers available   — show provider catalog
    xenia providers list        — list configured connections
    xenia providers test <name> — test a provider connection
    xenia providers test-all    — test all active connections
    xenia providers validate    — validate local configuration
`);
    });
}
