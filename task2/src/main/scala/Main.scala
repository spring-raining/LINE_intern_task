import java.io.File
import scala.io._
import com.github.tototoshi.csv._

object Main {
  val redisDomain = "localhost"
  val redisPort = 6379
  val dataStore = DataStore(redisDomain, redisPort)
  val crawler = Crawler(dataStore)
  val supervisor = Supervisor(dataStore)
  val absolutePath = new File("").getAbsolutePath + "/"
  val dictPath = absolutePath + "../neologd-seed/mecab-user-dict-seed.csv"
  val exportPath = absolutePath + "dump.tsv"

  def main(args: Array[String]) {
    println(s"Number of saving NEologd original form(s) is ${dataStore.countNEologdOriginalForm}")
    println(s"Number of analyzed word(s) is ${dataStore.countAnalyzedWord}")
    println(s"Number of analyzed user(s) is ${dataStore.countAnalyzedUser}")

    while (true) {
      print("Select command [init/crawl/supervise/export/exit] ")
      StdIn.readLine match {
        case "exit" => return
        case "init" => storeDataSet(dataStore, dictPath)
        case "crawl" => crawler.run()
        case "supervise" => supervisor.run()
        case "export" => exportWords(dataStore, exportPath)
        case _ =>
      }
    }
  }

  def storeDataSet(dataStore: DataStore, dictPath: String) = {
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

  def exportWords(dataStore: DataStore, exportPath: String) = {
    val writer = CSVWriter.open(exportPath, append = false)
    dataStore.getWeightedWords.foreach(word => {
      dataStore.getWordWeight(word).foreach(weight => {
        writer.writeRow(List(word, weight))
      })
    })
    writer.close()
    println(s"done (export path: $exportPath)")
  }
}
