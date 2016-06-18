import scala.io._
import com.github.tototoshi.csv._

object Main {
  val redisDomain = "localhost"
  val redisPort = 6379
  val dataStore = DataStore(redisDomain, redisPort)
  val dictPath = "/Users/aki/project/LINE_intern_task/neologd-seed/mecab-user-dict-seed.20160613.csv"
  val crawler = Crawler(dataStore)
  val supervisor = Supervisor(dataStore)

  def main(args: Array[String]) {
    println(s"Number of saving NEologd original form(s) is ${dataStore.countNEologdOriginalForm}")
    println(s"Number of analyzed word(s) is ${dataStore.countAnalyzedWord}")
    println(s"Number of analyzed user(s) is ${dataStore.countAnalyzedUser}")

    while (true) {
      print("Select command [init/crawl/supervise/exit] ")
      StdIn.readLine match {
        case "exit" => return
        case "init" => storeDataSet(dictPath)
        case "crawl" => crawler.run()
        case "supervise" => supervisor.run()
        case _ =>
      }
    }
  }

  def storeDataSet(dictPath: String) = {
    val reader = CSVReader.open(dictPath)

    var i = 0
    reader.foreach {
      case Seq(surfaceForm, lContextID, rContextId, cost, pos, posSec1, posSec2, posSec3, conjugatedForm, conjugateType, originalForm, reading, pronoun) => {
        dataStore.addNEologdOriginalForm(originalForm)
        i += 1
        if (i % 10000 == 0) {
          print(".")
        }
      }
    }
    println()
  }
}